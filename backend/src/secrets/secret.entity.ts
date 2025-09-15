import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Bookmark } from 'src/bookmarks/bookmark.entity';
import { Reply } from 'src/replies/reply.entity';
import { Mood } from 'src/moods/mood.entity';
import { Tag } from 'src/tags/tag.entity';
import { Reaction } from 'src/reactions/reaction.entity';
import { Cap } from 'src/caps/cap.entity';

export enum SecretStatus {
  UNDER_REVIEW = 'under_review',
  PUBLISHED = 'published',
  REMOVED = 'removed',
}

@Entity()
@Index(['status', 'createdAt'])  // Composite index for common queries
@Index(['userId', 'status'])     // Index for user's own secrets
@Index(['createdAt'])            // Index for time-based sorting
export class Secret {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  @Index('IDX_secret_text_gin', { synchronize: false }) // GIN index for full text search
  text: string;

  // Multi-mood relation
  @ManyToMany(() => Mood, (m) => m.secrets, { cascade: false })
  @JoinTable({
    name: 'secret_moods',
    joinColumn: { name: 'secretId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'moodId', referencedColumnName: 'id' },
  })
  moods?: Mood[];

  @ManyToMany(() => Tag, (t) => t.secrets, { cascade: false })
  @JoinTable({
    name: 'secret_tags',
    joinColumn: { name: 'secretId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags?: Tag[];

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

  // Aggregated engagement relations
  @OneToMany(() => Reaction, (reaction) => reaction.secret)
  reactions: Reaction[];

  @OneToMany(() => Cap, (cap) => cap.secret)
  caps: Cap[];
}
