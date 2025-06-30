// backend/src/bookmarks/bookmark.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
  JoinColumn,
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
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  secretId: string;

  @ManyToOne(() => Secret, (secret) => secret.bookmarks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'secretId' })
  secret: Secret;

  @CreateDateColumn()
  createdAt: Date;
}
