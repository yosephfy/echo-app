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
} from 'typeorm';
import { User } from '../users/user.entity';
import { Bookmark } from 'src/bookmarks/bookmark.entity';
import { Reply } from 'src/replies/reply.entity';
import { Mood } from 'src/moods/mood.entity';
import { Tag } from 'src/tags/tag.entity';

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

  reactions: any;
  caps: any;
}
