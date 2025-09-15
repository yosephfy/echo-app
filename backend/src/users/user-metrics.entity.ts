// backend/src/users/user-metrics.entity.ts
import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_metrics')
export class UserMetrics {
  @PrimaryColumn()
  userId: string;

  @ManyToOne(() => User, (user) => user.metrics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ default: 0 })
  postsCount: number;

  @Column({ default: 0 })
  reactionsGiven: number;

  @Column({ default: 0 })
  reactionsReceived: number;

  @Column({ default: 0 })
  capsGiven: number;

  @Column({ default: 0 })
  capsReceived: number;

  @Column({ default: 0 })
  repliesReceived: number;

  @Column({ default: 0 })
  bookmarksCount: number;

  @UpdateDateColumn()
  updatedAt: Date;
}