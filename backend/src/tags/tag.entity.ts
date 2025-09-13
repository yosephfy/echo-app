import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { Secret } from '../secrets/secret.entity';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Normalized slug (lowercase, no #, unique)
  @Index({ unique: true })
  @Column({ length: 64 })
  slug: string;

  // Original first-seen casing / representation (optional)
  @Column({ type: 'varchar', length: 64, nullable: true })
  raw?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @ManyToMany(() => Secret, (secret) => secret.tags)
  secrets: Secret[];
}
