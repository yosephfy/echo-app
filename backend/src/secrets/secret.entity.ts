import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum SecretStatus {
  UNDER_REVIEW = 'under_review',
  PUBLISHED = 'published',
  REMOVED = 'removed',
}

@Entity()
export class Secret {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  text: string;

  @Column({ length: 32, nullable: true })
  mood?: string;

  @Column({
    type: 'enum',
    enum: SecretStatus,
    default: SecretStatus.UNDER_REVIEW,
  })
  status: SecretStatus;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.secrets, { onDelete: 'CASCADE' })
  author: User;

  @CreateDateColumn()
  createdAt: Date;
}
