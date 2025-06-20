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

@Entity()
@Unique(['userId', 'secretId'])
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.reports, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  secretId: string;

  @ManyToOne(() => Secret, (secret) => secret, { onDelete: 'CASCADE' })
  secret: Secret;

  @Column({ nullable: true })
  reason?: string;

  @CreateDateColumn()
  createdAt: Date;
}
