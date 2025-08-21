import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_settings')
@Unique('UQ_user_setting_user_key', ['userId', 'key'])
@Index(['userId'])
export class UserSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 190 })
  key: string;

  /** Stored as string; coerce based on SettingDefinition.type */
  @Column({ type: 'text', nullable: true })
  value: string | null;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
