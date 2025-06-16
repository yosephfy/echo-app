import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { UpdateAvatarDto } from 'src/auth/dto/update-avatar.dto';
import { UpdateCredentialsDto } from 'src/auth/dto/update-credentials.dto';
import { Repository } from 'typeorm';
import { RegisterDto } from '../auth/dto/register.dto';
import { Bookmark } from '../bookmarks/bookmark.entity';
import { Secret } from '../secrets/secret.entity';
import { Streak } from '../streaks/streak.entity'; // if you have a Streak entity
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
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async create(email: string, passwordHash: string): Promise<User> {
    const user = this.usersRepo.create({ email, passwordHash });
    return this.usersRepo.save(user);
  }

  async register(dto: RegisterDto): Promise<Omit<User, 'passwordHash'>> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const hash = await argon2.hash(dto.password);
    const user = this.usersRepo.create({
      email: dto.email,
      passwordHash: hash,
    });
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

    (user as any).avatarUrl = dto.avatarUrl;
    return this.usersRepo.save(user);
  }

  async getStats(userId: string) {
    const postsCount = await this.secretsRepo.count({ where: { userId } });
    const bookmarksCount = await this.bookmarksRepo.count({
      where: { userId },
    });
    // assuming one active streak record per user
    const streak = await this.streaksRepo.findOne({ where: { userId } });
    return {
      postsCount,
      bookmarksCount,
      currentStreak: streak?.days || 0,
    };
  }
}
