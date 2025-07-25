import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Bookmark } from 'src/bookmarks/bookmark.entity';
import { Reply } from 'src/replies/reply.entity';

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

  @OneToMany(() => Bookmark, (bookmark) => bookmark.secret)
  bookmarks: Bookmark[];

  @OneToMany(() => Reply, (reply) => reply.secret)
  replies: Reply[];

  @CreateDateColumn()
  createdAt: Date;

  reactions: any;
  caps: any;
}
