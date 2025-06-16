import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class Streak {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.streaks, { onDelete: 'CASCADE' })
  user: User;

  @Column({ default: 0 })
  days: number; // current consecutive days streak

  @Column({ type: 'date', nullable: true })
  lastIncrementedOn?: string; // YYYY-MM-DD of last streak increment

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
