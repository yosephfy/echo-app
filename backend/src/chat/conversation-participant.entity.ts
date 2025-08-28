import {
  Entity,
  Column,
  ManyToOne,
  PrimaryColumn,
  CreateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';

@Entity('conversation_participants')
@Index(['userId'])
export class ConversationParticipant {
  @PrimaryColumn('uuid')
  conversationId: string;

  @PrimaryColumn('uuid')
  userId: string;

  @ManyToOne(() => Conversation, (c) => c.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @Column({ type: 'text', default: 'member' })
  role: 'member' | 'admin';

  @CreateDateColumn({ type: 'timestamptz' })
  joinedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  lastReadMessageId: string | null;

  @ManyToOne(() => Message, { nullable: true })
  @JoinColumn({ name: 'lastReadMessageId' })
  lastReadMessage?: Message | null;

  @Column({ type: 'int', default: 0 })
  unreadCount: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastReadAt: Date | null; // redundant but helpful for analytics; write-only
}
