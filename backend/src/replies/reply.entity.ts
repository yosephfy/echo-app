// backend/src/replies/reply.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Secret } from '../secrets/secret.entity';

@Entity()
export class Reply {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.replies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  author: User;

  @Column()
  secretId: string;

  @ManyToOne(() => Secret, (secret) => secret.replies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'secretId' })
  secret: Secret;

  @Column('text')
  text: string;

  @CreateDateColumn()
  createdAt: Date;

  reactions: any;
}
