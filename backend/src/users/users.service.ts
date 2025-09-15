import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { UpdateAvatarDto } from 'src/auth/dto/update-avatar.dto';
import { UpdateCredentialsDto } from 'src/auth/dto/update-credentials.dto';
import { Cap } from 'src/caps/cap.entity';
import { Reaction } from 'src/reactions/reaction.entity';
import { Reply } from 'src/replies/reply.entity';
import { Repository, In } from 'typeorm';
import { RegisterDto } from '../auth/dto/register.dto';
import { Bookmark } from '../bookmarks/bookmark.entity';
import { Secret } from '../secrets/secret.entity';
import { Streak } from '../streaks/streak.entity'; // if you have a Streak entity
import { HandleService } from './handle.service';
import { User } from './user.entity';
import { UserSort } from './dtos/search-users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(Secret)
    private secretsRepo: Repository<Secret>,
    @InjectRepository(Bookmark)
    private bookmarksRepo: Repository<Bookmark>,
    @InjectRepository(Streak)
    private streaksRepo: Repository<Streak>,
    @InjectRepository(Reaction)
    private reactionsRepo: Repository<Reaction>,
    @InjectRepository(Cap)
    private capsRepo: Repository<Cap>,
    @InjectRepository(Reply)
    private repliesRepo: Repository<Reply>,
    private handleSvc: HandleService,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async create(email: string, passwordHash: string): Promise<User> {
    const user = this.usersRepo.create({ email, passwordHash });
    return this.usersRepo.save(user);
  }

  async register(dto: RegisterDto): Promise<Omit<User, 'passwordHash'>> {
    // 1) Check email uniqueness
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // 2) Generate unique handle
    let handle: string;
    let exists: User | null;
    do {
      handle = this.handleSvc.generateHandle();
      exists = await this.usersRepo.findOne({ where: { handle } });
    } while (exists);

    // 3) Pick avatar
    const avatarUrl = this.handleSvc.pickAvatar();

    // 4) Create the user
    const hash = await argon2.hash(dto.password);
    const user = this.usersRepo.create({
      email: dto.email,
      passwordHash: hash,
      handle,
      avatarUrl,
    });

    const saved = await this.usersRepo.save(user);
    // remove hash before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = saved;
    return result;
  }

  /** Allow refreshing handle and/or avatar later */
  async refreshProfile(
    userId: string,
    opts: { handle?: boolean; avatar?: boolean },
  ) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    if (opts.handle) {
      let newHandle: string;
      let exists: User | null;
      do {
        newHandle = this.handleSvc.generateHandle();
        exists = await this.usersRepo.findOne({ where: { handle: newHandle } });
      } while (exists);
      user.handle = newHandle;
    }
    if (opts.avatar) {
      user.avatarUrl = this.handleSvc.pickAvatar();
    }

    const saved = await this.usersRepo.save(user);
    // remove hash before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = saved;
    return result;
  }

  async updateCredentials(userId: string, dto: UpdateCredentialsDto) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.email && dto.email !== user.email) {
      const exists = await this.findByEmail(dto.email);
      if (exists) throw new ConflictException('Email already in use');
      user.email = dto.email;
    }

    if (dto.password) {
      user.passwordHash = await argon2.hash(dto.password);
    }

    return this.usersRepo.save(user);
  }

  async updateAvatar(userId: string, dto: UpdateAvatarDto) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    user.avatarUrl = dto.random ? this.handleSvc.pickAvatar() : dto.avatarUrl;
    return this.usersRepo.save(user);
  }

  async updateProfile(
    userId: string,
    {
      bio,
      avatarUrl,
      handle,
    }: {
      bio?: string;
      avatarUrl?: string;
      handle?: string;
    },
  ) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (handle && handle !== user.handle) {
      const exists = await this.usersRepo.findOne({ where: { handle } });
      if (exists) throw new ConflictException('Handle already in use');
      user.handle = handle;
    }
    if (avatarUrl !== undefined)
      if (avatarUrl === null) user.avatarUrl = this.handleSvc.pickAvatar();
      else user.avatarUrl = avatarUrl;
    if (bio) user.bio = bio;
    return this.usersRepo.save(user);
  }

  async getStats(userId: string) {
    // Count posts excluding REMOVED status
    const postsCount = await this.secretsRepo.count({ 
      where: { 
        userId,
        status: In(['published', 'under_review']) 
      } 
    });

    const bookmarksCount = await this.bookmarksRepo.count({
      where: { userId },
    });

    // Reactions given by user
    const reactionsGiven = await this.reactionsRepo.count({
      where: { userId },
    });

    // Reactions received on user's secrets (with status filter)
    const reactionsReceived = await this.reactionsRepo
      .createQueryBuilder('reaction')
      .innerJoin('reaction.secret', 'secret')
      .where('secret.userId = :userId', { userId })
      .andWhere('secret.status IN (:...statuses)', { statuses: ['published', 'under_review'] })
      .getCount();

    // Caps given by user
    const capsGiven = await this.capsRepo.count({
      where: { userId },
    });

    // Caps received on user's secrets (with status filter)
    const capsReceived = await this.capsRepo
      .createQueryBuilder('cap')
      .innerJoin('cap.secret', 'secret')
      .where('secret.userId = :userId', { userId })
      .andWhere('secret.status IN (:...statuses)', { statuses: ['published', 'under_review'] })
      .getCount();

    // Replies received on user's secrets (with status filter)
    const repliesReceived = await this.secretsRepo
      .createQueryBuilder('secret')
      .leftJoin('secret.replies', 'reply')
      .where('secret.userId = :userId', { userId })
      .andWhere('secret.status IN (:...statuses)', { statuses: ['published', 'under_review'] })
      .select('COUNT(reply.id)', 'count')
      .getRawOne()
      .then(result => parseInt(result.count) || 0);

    // Calculate average reactions per post
    const avgReactionsPerPost = postsCount > 0 ? reactionsReceived / postsCount : 0;

    // Assuming one active streak record per user
    const streak = await this.streaksRepo.findOne({ where: { userId } });

    return {
      postsCount,
      bookmarksCount,
      currentStreak: streak?.days || 0,
      reactionsGiven,
      reactionsReceived,
      capsGiven,
      capsReceived,
      repliesReceived,
      avgReactionsPerPost: Math.round(avgReactionsPerPost * 100) / 100, // Round to 2 decimal places
    };
  }

  async searchUsers(opts: {
    requesterId?: string;
    query: string;
    page: number;
    limit: number;
    sort: UserSort;
  }) {
    const { requesterId, query, page, limit, sort } = opts;
    const offset = (page - 1) * limit;

    // Normalize query
    const q = (query ?? '').trim();
    const hasQ = q.length > 0;

    // Base QB
    const qb = this.usersRepo
      .createQueryBuilder('u')
      .select(['u.id', 'u.handle', 'u.avatarUrl']);

    // Optional: exclude requester from results
    if (requesterId) {
      qb.andWhere('u.id <> :requesterId', { requesterId });
    }

    // Basic search (prefix/substring, case-insensitive)
    if (hasQ) {
      // Use ILIKE for case-insensitive search on Postgres
      qb.andWhere('u.handle ILIKE :q', { q: `%${q}%` });
    }

    // Sorts
    if (sort === 'handle_asc') qb.orderBy('u.handle', 'ASC');
    else if (sort === 'handle_desc') qb.orderBy('u.handle', 'DESC');
    else qb.orderBy('u.handle', 'DESC'); // "recent"

    // Pagination
    qb.take(limit).skip(offset);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }
}
