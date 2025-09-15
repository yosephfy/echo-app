import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Secret } from '../secrets/secret.entity';

export enum ReactionType {
  Like = 'like',
  Love = 'love',
  Haha = 'haha',
  Wow = 'wow',
  Sad = 'sad',
}
@Entity()
@Unique(['userId', 'secretId'])
export class Reaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.reactions, { onDelete: 'CASCADE' })
  user: User;

  @Index()
  @Column()
  secretId: string;

  @ManyToOne(() => Secret, (secret) => secret.reactions, {
    onDelete: 'CASCADE',
  })
  secret: Secret;

  @Column({
    type: 'enum',
    enum: ReactionType,
  })
  type: ReactionType;

  @Index()
  @CreateDateColumn()
  createdAt: Date;
}
