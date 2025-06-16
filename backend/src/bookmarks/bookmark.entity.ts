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
export class Bookmark {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.bookmarks, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  secretId: string;

  @ManyToOne(() => Secret, (secret) => secret, { onDelete: 'CASCADE' })
  secret: Secret;

  @CreateDateColumn()
  createdAt: Date;
}
