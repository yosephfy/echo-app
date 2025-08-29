import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Conversation } from './conversation.entity';
import { ConversationParticipant } from './conversation-participant.entity';
import { Message } from './message.entity';
import { MessageClientToken } from './message-client-token.entity';
import { UserBlock } from './user-block.entity';
import { User } from '../users/user.entity'; // adjust path
import { ChatGateway } from './chat.gateway'; // <- to emit WS events

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private readonly convRepo: Repository<Conversation>,
    @InjectRepository(ConversationParticipant)
    private readonly partRepo: Repository<ConversationParticipant>,
    @InjectRepository(Message) private readonly msgRepo: Repository<Message>,
    @InjectRepository(MessageClientToken)
    private readonly tokenRepo: Repository<MessageClientToken>,
    @InjectRepository(UserBlock)
    private readonly blockRepo: Repository<UserBlock>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly gateway: ChatGateway,
  ) {}

  private async assertMember(userId: string, conversationId: string) {
    const exists = await this.partRepo.findOne({
      where: { conversationId, userId },
    });
    if (!exists) throw new ForbiddenException('Not a participant');
  }

  private async assertNotBlocked(a: string, b: string) {
    const blocked = await this.blockRepo.findOne({
      where: [
        { blockerId: a, blockedId: b },
        { blockerId: b, blockedId: a },
      ],
    });
    if (blocked) throw new ForbiddenException('User is blocked');
  }

  /** Start or reuse a 1:1 conversation */
  async startOneToOne(myId: string, peerUserId: string) {
    if (myId === peerUserId)
      throw new BadRequestException('Cannot chat with yourself');
    await this.assertNotBlocked(myId, peerUserId);

    // Try reuse: 2 participants exactly, one is me and one is peer
    const existing = await this.partRepo
      .createQueryBuilder('p')
      .select('p.conversationId', 'conversationId')
      .where('p.userId IN (:...ids)', { ids: [myId, peerUserId] })
      .groupBy('p.conversationId')
      .having('COUNT(*) = 2')
      .getRawOne<{ conversationId: string }>();

    let conversationId = existing?.conversationId;
    if (!conversationId) {
      const conv = await this.convRepo.save(this.convRepo.create({}));
      conversationId = conv.id;
      await this.partRepo.save([
        this.partRepo.create({ conversationId, userId: myId }),
        this.partRepo.create({ conversationId, userId: peerUserId }),
      ]);
    }
    return { conversationId };
  }

  /** List conversations with peer + lastMessage (author populated) */
  async listConversations(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    // fetch my participant rows
    const parts = await this.partRepo.find({
      where: { userId },
      relations: ['conversation'],
      order: {
        conversation: { lastMessageCreatedAt: 'DESC' } as any,
        joinedAt: 'DESC',
      },
      skip: offset,
      take: limit,
    });

    const total = await this.partRepo.count({ where: { userId } });
    const convIds = parts.map((p) => p.conversationId);
    if (convIds.length === 0) {
      return { items: [], total, page, limit };
    }

    // load all participants for these convs to determine peer
    const allParts = await this.partRepo.find({
      where: { conversationId: In(convIds) },
    });

    // build convId -> otherUserId
    const peerByConv = new Map<string, string>();
    for (const cid of convIds) {
      const ps = allParts.filter((p) => p.conversationId === cid);
      // 1:1 expected; pick the one that isn't me
      const peer = ps.find((p) => p.userId !== userId);
      if (peer) peerByConv.set(cid, peer.userId);
    }

    // load peer users
    const peerIds = Array.from(new Set([...peerByConv.values()]));
    const peers = peerIds.length
      ? await this.userRepo.find({
          where: { id: In(peerIds) },
          select: ['id', 'handle', 'avatarUrl'],
        })
      : [];
    const peerMap = new Map(peers.map((u) => [u.id, u]));

    // load last messages with author relation populated
    const lastMessages = await this.msgRepo.find({
      where: { conversationId: In(convIds) },
      relations: ['author'],
      order: { createdAt: 'DESC' },
      take: convIds.length * 3, // small overfetch then map per conv
    });
    const lastByConv = new Map<string, Message>();
    for (const m of lastMessages) {
      if (!lastByConv.has(m.conversationId)) {
        lastByConv.set(m.conversationId, m);
      }
    }

    const items = parts.map((p) => {
      const cid = p.conversationId;
      const last = lastByConv.get(cid) ?? null;
      const peerUser = peerByConv.has(cid)
        ? peerMap.get(peerByConv.get(cid)!)
        : null;

      return {
        id: cid,
        unreadCount: p.unreadCount ?? 0,
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
        updatedAt: (p.conversation?.lastMessageCreatedAt ?? p.joinedAt) as Date,
        peer: peerUser
          ? {
              id: peerUser.id,
              handle: (peerUser as any).handle,
              avatarUrl: (peerUser as any).avatarUrl,
            }
          : null,
      };
    });

    return { items, total, page, limit };
  }

  /** Messages: OLDEST→NEWEST and author populated */
  async listMessages(
    userId: string,
    conversationId: string,
    page = 1,
    limit = 30,
  ) {
    await this.assertMember(userId, conversationId);

    const [rows, total] = await this.msgRepo.findAndCount({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      relations: ['author'],
      take: limit,
      skip: (page - 1) * limit,
    });

    const items = rows.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      body: m.body,
      attachmentUrl: m.attachmentUrl,
      mimeType: m.mimeType,
      createdAt: m.createdAt,
      author: m.author
        ? {
            id: m.author.id,
            handle: (m.author as any).handle,
            avatarUrl: (m.author as any).avatarUrl,
          }
        : null,
    }));

    return { items, total, page, limit };
  }

  /** Send message (idempotent), bump unread, emit events */
  async sendMessage(
    userId: string,
    conversationId: string,
    body: string,
    clientToken: string,
    attachmentUrl?: string,
    mimeType?: string,
  ) {
    await this.assertMember(userId, conversationId);

    // Idempotency
    const tokenHit = await this.tokenRepo.findOne({ where: { clientToken } });
    if (tokenHit) {
      const existing = await this.msgRepo.findOne({
        where: { id: tokenHit.messageId },
        relations: ['author'],
      });
      if (existing) return this.serializeMessage(existing);
    }

    // Create
    const msg = await this.msgRepo.save(
      this.msgRepo.create({
        conversationId,
        authorId: userId,
        body: body ?? '',
        attachmentUrl: attachmentUrl ?? null,
        mimeType: mimeType ?? null,
      }),
    );

    await this.tokenRepo.save(
      this.tokenRepo.create({ clientToken, messageId: msg.id }),
    );

    // Update conversation last message fields
    await this.convRepo.update(conversationId, {
      lastMessageId: msg.id,
      lastMessageCreatedAt: msg.createdAt,
    });

    // Bump unread for other participants
    await this.partRepo
      .createQueryBuilder()
      .update()
      .set({ unreadCount: () => `"unreadCount" + 1` })
      .where(`"conversationId" = :conversationId`, { conversationId })
      .andWhere(`"userId" <> :authorId`, { authorId: userId })
      .execute();

    // Reload author to serialize
    const withAuthor = await this.msgRepo.findOne({
      where: { id: msg.id },
      relations: ['author'],
    });
    const serialized = this.serializeMessage(withAuthor!);

    // Emit events
    this.gateway.emitMessageNew(conversationId, serialized);
    const parts = await this.partRepo.find({ where: { conversationId } });

    // Build the base "row" (lastMessage etc.). Do NOT put unreadCount here.
    const baseRow = {
      id: conversationId,
      lastMessage: serialized, // your serializeMessage result
      updatedAt: serialized.createdAt,
    };

    // Emit a per-user payload including their own unreadCount
    for (const p of parts) {
      this.gateway.emitConversationUpdatedForUser(p.userId, {
        ...baseRow,
        unreadCount: p.userId === userId ? 0 : p.unreadCount, // sender stays 0, others bumped
      });
    }
    return serialized;
  }

  /** Mark read → reset unread; emit conversation:updated */
  async markRead(
    userId: string,
    conversationId: string,
    lastReadMessageId: string,
  ) {
    await this.assertMember(userId, conversationId);

    const last = await this.msgRepo.findOne({
      where: { id: lastReadMessageId, conversationId },
    });
    if (!last)
      throw new NotFoundException('Message not found in this conversation');

    await this.partRepo.update(
      { conversationId, userId },
      {
        lastReadMessageId,
        unreadCount: 0,
        lastReadAt: new Date(),
      },
    );

    // Let THIS user’s list clear its badge immediately
    this.gateway.emitConversationUpdatedForUser(userId, {
      id: conversationId,
      lastMessage: await this.msgRepo
        .findOne({ where: { id: last.id } }) // or serialized
        .then((m) => this.serializeMessage(m!)),
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
    });

    return { ok: true };
  }

  private serializeMessage(m: Message) {
    return {
      id: m.id,
      conversationId: m.conversationId,
      body: m.body,
      attachmentUrl: m.attachmentUrl,
      mimeType: m.mimeType,
      createdAt: m.createdAt,
      author: m.author
        ? {
            id: m.author.id,
            handle: (m.author as any).handle,
            avatarUrl: (m.author as any).avatarUrl,
          }
        : null,
    };
  }
}
