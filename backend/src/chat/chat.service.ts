import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { Conversation } from './conversation.entity';
import { ConversationParticipant } from './conversation-participant.entity';
import { Message } from './message.entity';
import { MessageClientToken } from './message-client-token.entity';
import { UserBlock } from './user-block.entity';

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
  ) {}

  /** Ensure user is a participant of the conversation */
  private async assertMember(userId: string, conversationId: string) {
    const exists = await this.partRepo.findOne({
      where: { conversationId, userId },
    });
    if (!exists) throw new ForbiddenException('Not a participant');
  }

  /** Ensure no mutual blocks */
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

    // Try reuse: find conversation that has exactly these two participants
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

  /** Faster conversation list using counter cache + lastMessage fields */
  async listConversations(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    // Conversations I participate in (ordered by lastMessageCreatedAt desc, fallback joinedAt)
    const qb = this.partRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.conversation', 'c')
      .where('p.userId = :userId', { userId })
      .orderBy('c.lastMessageCreatedAt', 'DESC')
      .addOrderBy('p.joinedAt', 'DESC')
      .skip(offset)
      .take(limit);

    const parts = await qb.getMany();
    const total = await this.partRepo.count({ where: { userId } });

    // Select lastMessages in one go (map by id)
    const convIds = parts.map((p) => p.conversationId);
    let lastByConv = new Map<string, Message>();
    if (convIds.length) {
      const lastMessages = await this.msgRepo
        .createQueryBuilder('m')
        .where(
          'm.id IN ' +
            qb
              .subQuery()
              .select('DISTINCT ON (c.id) m2.id')
              .from(Message, 'm2')
              .innerJoin('m2.conversation', 'c')
              .where('c.id IN (:...ids)', { ids: convIds })
              .orderBy('c.id, m2.createdAt', 'DESC')
              .getQuery(),
        )
        .getMany();

      lastByConv = new Map(lastMessages.map((m) => [m.conversationId, m]));
    }

    const items = parts.map((p) => ({
      id: p.conversationId,
      unreadCount: p.unreadCount, // <-- COUNTER CACHE
      lastMessage: lastByConv.get(p.conversationId) ?? null,
    }));

    return { items, total, page, limit };
  }
  /** Paginated messages, OLDEST -> NEWEST for forward scroll lists */
  async listMessages(
    userId: string,
    conversationId: string,
    page = 1,
    limit = 30,
  ) {
    await this.assertMember(userId, conversationId);

    const [items, total] = await this.msgRepo.findAndCount({
      where: { conversationId },
      order: { createdAt: 'ASC' }, // <-- FLIPPED
      take: limit,
      skip: (page - 1) * limit,
    });

    return { items, total, page, limit };
  }
  /** Send message with idempotency, update lastMessage*, bump unread counters */
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
      });
      if (existing) return existing;
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

    // Persist idempotency key
    await this.tokenRepo.save(
      this.tokenRepo.create({ clientToken, messageId: msg.id }),
    );

    // Update conversation last message fields
    await this.convRepo.update(conversationId, {
      lastMessageId: msg.id,
      lastMessageCreatedAt: msg.createdAt,
    });

    // Bump unread for ALL other participants
    await this.partRepo
      .createQueryBuilder()
      .update()
      .set({ unreadCount: () => `"unreadCount" + 1` })
      .where(`"conversationId" = :conversationId`, { conversationId })
      .andWhere(`"userId" <> :authorId`, { authorId: userId })
      .execute();

    return msg;
  }

  /** Mark conversation read: set pointer + reset unread counter */
  async markRead(
    userId: string,
    conversationId: string,
    lastReadMessageId: string,
  ) {
    await this.assertMember(userId, conversationId);

    // validate message belongs to conversation (optional fast-path)
    const last = await this.msgRepo.findOne({
      where: { id: lastReadMessageId, conversationId },
    });
    if (!last)
      throw new NotFoundException('Message not found in this conversation');

    await this.partRepo.update(
      { conversationId, userId },
      {
        lastReadMessageId,
        lastReadMessage: last, // if you keep relation hydrated
        unreadCount: 0, // <-- RESET COUNTER
        lastReadAt: new Date(), // optional
      },
    );

    return { ok: true };
  }
}
