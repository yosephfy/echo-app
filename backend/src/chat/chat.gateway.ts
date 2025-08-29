import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConversationParticipant } from './conversation-participant.entity';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';

@WebSocketGateway({ namespace: '/ws', cors: { origin: '*' } })
export class ChatGateway {
  @WebSocketServer() server: Server;

  constructor(
    @InjectRepository(ConversationParticipant)
    private readonly partRepo: Repository<ConversationParticipant>,
    @InjectRepository(Conversation)
    private readonly convRepo: Repository<Conversation>,
    @InjectRepository(Message) private readonly msgRepo: Repository<Message>,
  ) {}

  // Rooms are `conversation:<id>`
  emitMessageNew(conversationId: string, message: any) {
    this.server
      .to(`conversation:${conversationId}`)
      .emit('message:new', { conversationId, message });
  }

  async emitConversationUpdated(conversationId: string) {
    // Load participants to broadcast per-user (or to room for simplicity)
    const parts = await this.partRepo.find({ where: { conversationId } });
    const conv = await this.convRepo.findOne({ where: { id: conversationId } });
    const last = conv?.lastMessageId
      ? await this.msgRepo.findOne({
          where: { id: conv.lastMessageId },
          relations: ['author'],
        })
      : null;

    const payload = {
      id: conversationId,
      updatedAt: conv?.lastMessageCreatedAt ?? conv?.createdAt,
      lastMessage: last
        ? {
            id: last.id,
            conversationId: last.conversationId,
            body: last.body,
            attachmentUrl: last.attachmentUrl,
            mimeType: last.mimeType,
            createdAt: last.createdAt,
            author: last.author
              ? {
                  id: last.author.id,
                  handle: (last.author as any).handle,
                  avatarUrl: (last.author as any).avatarUrl,
                }
              : null,
          }
        : null,
      // unreadCount is per-user; clients will recompute locally for own row, or you can emit per user:
    };

    // Option A: broadcast to the room; clients will refetch or patch row
    this.server
      .to(`conversation:${conversationId}`)
      .emit('conversation:updated', payload);

    // Option B (per-user unread): emit to each user's personal room with user-specific unread counts
    // for (const p of parts) {
    //   const row = await this.partRepo.findOne({ where: { conversationId, userId: p.userId } });
    //   this.server.to(`user:${p.userId}`).emit('conversation:updated', { ...payload, unreadCount: row?.unreadCount ?? 0 });
    // }
  }

  // (Optional) handlers for join/leave
  handleConnection() {}
  handleDisconnect() {}

  // called by your REST (or use @SubscribeMessage to handle client joins)
  joinConversation(client: any, conversationId: string) {
    client.join(`conversation:${conversationId}`);
  }
  leaveConversation(client: any, conversationId: string) {
    client.leave(`conversation:${conversationId}`);
  }
}
