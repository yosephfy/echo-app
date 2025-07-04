import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
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

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.reactions, { onDelete: 'CASCADE' })
  user: User;

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

  @CreateDateColumn()
  createdAt: Date;
}
