import { Entity, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('user_blocks')
export class UserBlock {
  @PrimaryColumn('uuid')
  blockerId: string;

  @PrimaryColumn('uuid')
  blockedId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
