import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';

@Entity('messages')
@Index(['conversationId', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  conversationId: string;

  @ManyToOne(() => Conversation, (c) => c.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @Column('uuid')
  authorId: string;

  @Column({ type: 'text', default: '' })
  body: string;

  @Column({ type: 'text', nullable: true })
  attachmentUrl?: string | null;

  @Column({ type: 'text', nullable: true })
  mimeType?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true })
  editedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
