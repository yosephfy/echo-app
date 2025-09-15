// backend/src/replies/reply.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Secret } from '../secrets/secret.entity';

@Entity()
export class Reply {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.replies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  author: User;

  @Index()
  @Column()
  secretId: string;

  @ManyToOne(() => Secret, (secret) => secret.replies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'secretId' })
  secret: Secret;

  @Column('text')
  text: string;

  @Index()
  @CreateDateColumn()
  createdAt: Date;

  reactions: any;
}
