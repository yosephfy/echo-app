// backend/src/users/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Unique,
} from 'typeorm';
import { Secret } from '../secrets/secret.entity';
import { Bookmark } from '../bookmarks/bookmark.entity';
import { Streak } from '../streaks/streak.entity';

@Entity()
@Unique(['email'])
@Unique(['handle'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  passwordHash: string;

  @Column({ default: true })
  active: boolean;

  /** User-selected or auto-assigned handle, e.g. "SilverFox42" */
  @Column({ unique: true, nullable: true })
  handle: string;

  /** URL to an avatar image; chosen from a fixed pool */
  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ nullable: true })
  bio?: string;

  @OneToMany(() => Secret, (secret) => secret.author)
  secrets: Secret[];

  @OneToMany(() => Bookmark, (bookmark) => bookmark.user)
  bookmarks: Bookmark[];

  @OneToMany(() => Streak, (streak) => streak.user)
  streaks: Streak[];

  // Preferences moved to Settings; legacy relation removed

  reactions: any;
  tokens: any;
  caps: any;
  reports: any;
  replies: any;
  replyReactions: any;
}
