// backend/src/reply-reactions/reply-reaction.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Reply } from '../replies/reply.entity';

export enum ReplyReactionType {
  Like = 'like',
  Love = 'love',
  Haha = 'haha',
  Wow = 'wow',
  Sad = 'sad',
}

@Entity()
@Unique(['userId', 'replyId', 'type'])
export class ReplyReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.replyReactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  replyId: string;

  @ManyToOne(() => Reply, (reply) => reply.reactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'replyId' })
  reply: Reply;

  @Column({ type: 'enum', enum: ReplyReactionType })
  type: ReplyReactionType;

  @CreateDateColumn()
  createdAt: Date;
}
