// backend/src/caps/cap.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Secret } from '../secrets/secret.entity';

@Entity()
@Unique(['userId', 'secretId'])
export class Cap {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => User, (u) => u.caps, { onDelete: 'CASCADE' })
  user: User;

  @Index()
  @Column()
  secretId: string;

  @ManyToOne(() => Secret, (s) => s.caps, { onDelete: 'CASCADE' })
  secret: Secret;

  @Index()
  @CreateDateColumn()
  createdAt: Date;
}
