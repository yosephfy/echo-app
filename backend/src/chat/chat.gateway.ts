import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({ namespace: '/ws', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace(/^Bearer\s+/, '');
      if (!token) return client.disconnect();
      const payload: any = jwt.verify(token, process.env.JWT_SECRET!);
      const userId = payload?.sub || payload?.id;
      if (!userId) return client.disconnect();
      (client as any).userId = userId;
      client.join(`user:${userId}`);
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('conversation:join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() { conversationId }: { conversationId: string },
  ) {
    client.join(`conversation:${conversationId}`);
    // ack back so the client can log success
    client.emit('conversation:joined', { conversationId });
  }

  @SubscribeMessage('conversation:leave')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() { conversationId }: { conversationId: string },
  ) {
    client.leave(`conversation:${conversationId}`);
  }

  emitMessageNew(conversationId: string, message: any) {
    this.server
      .to(`conversation:${conversationId}`)
      .emit('message:new', { conversationId, message });
  }

  emitConversationUpdatedForUsers(userIds: string[], payload: any) {
    for (const uid of userIds) {
      this.server.to(`user:${uid}`).emit('conversation:updated', payload);
    }
  }

  // add a per-user emitter
  emitConversationUpdatedForUser(userId: string, payload: any) {
    this.server.to(`user:${userId}`).emit('conversation:updated', payload);
  }
}
