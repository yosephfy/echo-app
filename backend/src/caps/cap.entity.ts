// backend/src/caps/cap.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Secret } from '../secrets/secret.entity';

@Entity()
@Unique(['userId', 'secretId'])
export class Cap {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (u) => u.caps, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  secretId: string;

  @ManyToOne(() => Secret, (s) => s.caps, { onDelete: 'CASCADE' })
  secret: Secret;

  @CreateDateColumn()
  createdAt: Date;
}
