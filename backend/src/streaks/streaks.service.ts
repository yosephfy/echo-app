import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { Between, Repository } from 'typeorm';
import { Streak } from './streak.entity';
import { Secret } from '../secrets/secret.entity';

@Injectable()
export class StreaksService {
  private readonly logger = new Logger(StreaksService.name);

  constructor(
    @InjectRepository(Streak)
    private readonly streakRepo: Repository<Streak>,
    @InjectRepository(Secret)
    private readonly secretRepo: Repository<Secret>,
  ) {}

  /**
   * Runs every day at 00:05 AM server time.
   * For each user, checks if they posted yesterday.
   * If yes, increments their streak; otherwise resets to 0.
   */
  @Cron('5 0 * * *')
  async handleCron() {
    this.logger.log('Starting daily streak calculation');

    // 1. Find all users with streak records
    const allStreaks = await this.streakRepo.find();

    // 2. Compute yesterday’s date range
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const start = new Date(yesterday);
    const end = new Date(yesterday);
    end.setHours(23, 59, 59, 999);

    for (const streak of allStreaks) {
      // Count secrets by this user created yesterday
      const count = await this.secretRepo.count({
        where: {
          userId: streak.userId,
          createdAt: Between(start, end),
        },
      });

      if (count > 0) {
        streak.days += 1;
      } else {
        streak.days = 0;
      }

      streak.lastIncrementedOn = yesterday.toISOString().slice(0, 10);
      await this.streakRepo.save(streak);
      this.logger.log(`User ${streak.userId} streak updated to ${streak.days}`);
    }

    this.logger.log('Daily streak calculation complete');
  }

  // fetch all
  async findAll(): Promise<Streak[]> {
    return this.streakRepo.find();
  }

  // fetch one
  async findByUserId(userId: string): Promise<Streak | null> {
    return this.streakRepo.findOne({ where: { userId } });
  }
}
