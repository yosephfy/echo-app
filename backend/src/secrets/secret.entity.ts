import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
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

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => User, (user) => user.secrets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' }) // tells TypeORM which column is the FK
  author: User;

  @CreateDateColumn()
  createdAt: Date;
  reactions: any;
  caps: any;
}
