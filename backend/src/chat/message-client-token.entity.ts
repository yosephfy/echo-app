import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Message } from './message.entity';

@Entity('message_client_tokens')
export class MessageClientToken {
  @PrimaryColumn('text')
  clientToken: string;

  @Column('uuid')
  messageId: string;

  @ManyToOne(() => Message, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'messageId' })
  message: Message;
}
