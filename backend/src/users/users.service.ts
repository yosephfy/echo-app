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
import { Repository } from 'typeorm';
import { RegisterDto } from '../auth/dto/register.dto';
import { Bookmark } from '../bookmarks/bookmark.entity';
import { Secret } from '../secrets/secret.entity';
import { Streak } from '../streaks/streak.entity'; // if you have a Streak entity
import { HandleService } from './handle.service';
import { User } from './user.entity';

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

    user.avatarUrl = dto.avatarUrl;
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
    if (avatarUrl) user.avatarUrl = avatarUrl;
    if (bio) user.bio = bio;
    return this.usersRepo.save(user);
  }

  async getStats(userId: string) {
    const postsCount = await this.secretsRepo.count({ where: { userId } });
    const bookmarksCount = await this.bookmarksRepo.count({
      where: { userId },
    });
    const totalReactions = await this.reactionsRepo.count({
      where: { userId },
    });
    const totalCaps = await this.capsRepo.count({ where: { userId } });
    // assuming one active streak record per user
    const streak = await this.streaksRepo.findOne({ where: { userId } });
    return {
      postsCount,
      bookmarksCount,
      currentStreak: streak?.days || 0,
      totalReactions: totalReactions, // implement if you have reactions
      totalCaps: totalCaps, // implement if you have caps
    };
  }
}
