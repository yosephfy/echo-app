import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { Secret } from '../secrets/secret.entity';
import { Bookmark } from '../bookmarks/bookmark.entity';
import { Streak } from '../streaks/streak.entity';
import { UserPreference } from 'src/preferences/user-preference.entity';

@Entity()
export class User {
  [x: string]: any;
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ default: true })
  active: boolean;

  @Column({ nullable: true })
  avatarUrl?: string;

  @OneToMany(() => Secret, (secret) => secret.author)
  secrets: Secret[];

  @OneToMany(() => Bookmark, (bookmark) => bookmark.user)
  bookmarks: Bookmark[];

  @OneToMany(() => Streak, (streak) => streak.user)
  streaks: Streak[];

  @OneToMany(() => UserPreference, (preference) => preference.user)
  preferences: UserPreference[];
}
