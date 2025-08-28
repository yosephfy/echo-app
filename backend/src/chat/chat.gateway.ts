import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { ChatService } from './chat.service';

// Adjust to your env var / config service
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

@WebSocketGateway({
  namespace: '/ws',
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() io: Server;

  constructor(private readonly chat: ChatService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) return client.disconnect(true);
      const payload = jwt.verify(token, JWT_SECRET) as {
        sub: string;
        id?: string;
      };
      const userId = payload.id ?? payload.sub;
      (client.data as any).userId = userId;

      // join a personal room to receive per-user updates
      client.join(`user:${userId}`);
    } catch {
      client.disconnect(true);
    }
  }

  async handleDisconnect(_client: Socket) {}

  /** Client asks to join a conversation room */
  @SubscribeMessage('conversation:join')
  async onJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = (client.data as any).userId;
    await this.chat['assertMember'](userId, data.conversationId); // guarded call
    client.join(`conversation:${data.conversationId}`);
    client.emit('conversation:joined', { conversationId: data.conversationId });
  }

  @SubscribeMessage('conversation:leave')
  async onLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
    client.emit('conversation:left', { conversationId: data.conversationId });
  }

  /** Optional: send via WS (use REST for persistence; WS for convenience) */
  @SubscribeMessage('message:send')
  async onSend(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      conversationId: string;
      body: string;
      clientToken: string;
      attachmentUrl?: string;
      mimeType?: string;
    },
  ) {
    const userId = (client.data as any).userId;
    const msg = await this.chat.sendMessage(
      userId,
      data.conversationId,
      data.body,
      data.clientToken,
      data.attachmentUrl,
      data.mimeType,
    );

    // 1) New message to the room
    this.io.to(`conversation:${data.conversationId}`).emit('message:new', {
      conversationId: data.conversationId,
      message: msg,
    });

    // 2) Conversation unread counters per participant
    // Query fresh participants to read their current unreadCount
    const parts = await this.chat['partRepo'].find({
      where: { conversationId: data.conversationId },
    });

    for (const p of parts) {
      // Personal event channel per user (socket.io "room" pattern by user id is common)
      this.io.to(`user:${p.userId}`).emit('conversation:updated', {
        id: data.conversationId,
        unreadCount: p.unreadCount,
        lastMessage: msg,
      });
    }

    return msg;
  }

  /** Let client push read receipts */
  @SubscribeMessage('read:mark')
  async onRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; lastReadMessageId: string },
  ) {
    const userId = (client.data as any).userId;
    await this.chat.markRead(
      userId,
      data.conversationId,
      data.lastReadMessageId,
    );

    // Emit personal updated unread=0
    this.io.to(`user:${userId}`).emit('conversation:updated', {
      id: data.conversationId,
      unreadCount: 0,
      lastMessage: null, // not required; client can keep last
    });

    // Optional: broadcast read receipt to the room (e.g., for checkmarks)
    this.io.to(`conversation:${data.conversationId}`).emit('read:updated', {
      conversationId: data.conversationId,
      userId,
      lastReadMessageId: data.lastReadMessageId,
    });
  }
}
