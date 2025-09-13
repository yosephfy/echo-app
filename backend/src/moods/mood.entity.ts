import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  Index,
} from 'typeorm';
import { Secret } from '../secrets/secret.entity';

@Entity('moods')
export class Mood {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Stable unique machine-readable code (e.g., "joy", "anxious")
  @Index({ unique: true })
  @Column({ length: 40 })
  code: string;

  // Human-facing label (can change without breaking references)
  @Column({ length: 80 })
  label: string;

  // Optional category for grouping / UI theming
  @Column({ type: 'varchar', length: 40, nullable: true })
  category?: string | null;

  @Column({ default: true })
  active: boolean;

  @ManyToMany(() => Secret, (secret) => secret.moods)
  secrets: Secret[];
}
