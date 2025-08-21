import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

@Entity('user_setting_changes')
@Index(['userId', 'key', 'createdAt'])
export class UserSettingChange {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 190 })
  key: string;

  @Column({ type: 'text', nullable: true })
  oldValue: string | null;

  @Column({ type: 'text', nullable: true })
  newValue: string | null;

  @Column({ type: 'uuid', nullable: true })
  changedBy?: string | null;

  @Column({ type: 'json', nullable: true })
  context?: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;
}
