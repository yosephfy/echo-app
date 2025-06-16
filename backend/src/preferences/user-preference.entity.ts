// backend/src/preferences/user-preference.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
@Unique(['userId', 'key'])
export class UserPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.preferences, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  key: string; // e.g. 'darkMode', 'notifyCooldown', 'language'

  @Column('text')
  value: string; // JSON-encoded for complex prefs, or simple 'true'/'false'
}
