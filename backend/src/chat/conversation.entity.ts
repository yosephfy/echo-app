import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
  Index,
  Column,
} from 'typeorm';
import { ConversationParticipant } from './conversation-participant.entity';
import { Message } from './message.entity';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => ConversationParticipant, (p) => p.conversation, {
    cascade: true,
  })
  participants: ConversationParticipant[];

  @OneToMany(() => Message, (m) => m.conversation)
  messages: Message[];

  @Column({ type: 'uuid', nullable: true })
  lastMessageId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastMessageCreatedAt: Date | null;
}
