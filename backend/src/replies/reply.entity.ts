import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Secret } from '../secrets/secret.entity';

@Entity()
export class Reply {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.replies, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  secretId: string;

  @ManyToOne(() => Secret, (secret) => secret, { onDelete: 'CASCADE' })
  secret: Secret;

  @Column('text')
  text: string;

  @CreateDateColumn()
  createdAt: Date;
}
