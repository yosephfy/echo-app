import {
  Entity,
  PrimaryColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type SettingType = 'boolean' | 'string' | 'integer' | 'json' | 'enum';

@Entity('setting_definitions')
@Index(['section'])
export class SettingDefinition {
  /** Stable machine key, e.g. "notifications.push.enabled" */
  @PrimaryColumn({ type: 'varchar', length: 190 })
  key: string;

  /** Top-level grouping, e.g. "notifications", "privacy" */
  @Column({ type: 'varchar', length: 80 })
  section: string;

  @Column({ type: 'varchar', length: 16 })
  type: SettingType;

  /** Default value serialized as text/JSON string */
  @Column({ type: 'text', nullable: true })
  defaultValue: string | null;

  /**
   * UI/validation metadata, e.g.
   * { label, description, options:[{value,label}], min, max, regex }
   * Use 'jsonb' on Postgres (fallback 'json' if needed).
   */
  @Column({
    type: process.env.DB_TYPE === 'postgres' ? 'jsonb' : 'json',
    nullable: true,
  })
  metadata?: Record<string, any> | null;

  @Column({ type: 'boolean', default: false })
  isDeprecated: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
