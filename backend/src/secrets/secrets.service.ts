import { Injectable, Inject, ForbiddenException, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Secret, SecretStatus } from './secret.entity';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { Queue } from 'bullmq';
import { User } from 'src/users/user.entity';

const COOLDOWN_SECONDS = 24 * 60 * 60; // 24h

@Injectable()
export class SecretsService {
  private readonly logger = new Logger(SecretsService.name);

  constructor(
    @InjectRepository(Secret)
    private secretsRepo: Repository<Secret>,
    @Inject('REDIS') private redis: Redis,
    @Inject('MOD_QUEUE') private modQueue: Queue,
    @Inject('NOTIF_QUEUE') private readonly notifQueue: Queue,
  ) {}

  /** Attempt to create a secret for a user, enforcing 24h cooldown */
  async createSecret(
    userId: string,
    text: string,
    mood?: string,
  ): Promise<Secret> {
    const cooldownKey = `cooldown:${userId}`;
    const ttl = await this.redis.ttl(cooldownKey);

    if (ttl > 0) {
      throw new ForbiddenException(
        `Cooldown active. Try again in ${ttl} seconds.`,
      );
    }

    // Save the secret
    const secret = this.secretsRepo.create({ userId, text, mood });
    const saved = await this.secretsRepo.save(secret);

    // Set cooldown key
    await this.redis.set(cooldownKey, '1', 'EX', COOLDOWN_SECONDS);

    await this.modQueue.add('moderate', {
      secretId: saved.id,
      text: saved.text,
    });
    console.log(`🔔 [SecretsService] Enqueued moderation for ${saved.id}`);

    // 24-h cooldown complete notification
    await this.notifQueue.add(
      'cooldown',
      { userId, type: 'cooldown' },
      { delay: 24 * 60 * 60 * 1000 }, // 24 hours
    );

    // 3-h before cooldown ends reminder
    await this.notifQueue.add(
      'reminder',
      { userId, type: 'reminder' },
      { delay: 21 * 60 * 60 * 1000 }, // 21 hours
    );

    this.logger.log(`Scheduled cooldown and reminder for user ${userId}`);

    // now reload with author relation
    const full = await this.secretsRepo.findOne({
      where: { id: saved.id },
      relations: ['author'],
    });

    // full should never be null here
    return full!;
  }

  async getCooldownSeconds(userId: string): Promise<number> {
    const ttl = await this.redis.ttl(`cooldown:${userId}`);
    // redis.ttl returns -2 if key doesn’t exist, -1 if no expiry
    return ttl > 0 ? ttl : 0;
  }

  /** Returns the cooldown start, total duration, and seconds remaining */
  async getCooldownInfo(userId: string): Promise<{
    start: string;
    duration: number;
    remaining: number;
  }> {
    // how many seconds remain before the key expires
    const ttl = await this.redis.ttl(`cooldown:${userId}`);
    const remaining = ttl > 0 ? ttl : 0;
    const startTimestamp = Date.now() - (COOLDOWN_SECONDS - remaining) * 1000;
    return {
      start: new Date(startTimestamp).toISOString(),
      duration: COOLDOWN_SECONDS,
      remaining,
    };
  }

  // backend/src/secrets/secrets.service.ts

  async getFeed(userId: string, page: number, limit: number, mood?: string) {
    const q = this.secretsRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.author', 'author')
      .where('s.status IN (:...statuses)', {
        statuses: [SecretStatus.PUBLISHED, SecretStatus.UNDER_REVIEW],
      })
      .orderBy('s.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (mood) {
      q.andWhere('s.mood = :mood', { mood });
    }

    const [items, total] = await q.getManyAndCount();

    // OPTION A: Filter out secrets with no author
    const filtered = items.filter((s) => s.author !== null);

    return {
      items: filtered.map((s) => ({
        id: s.id,
        text: s.text,
        mood: s.mood,
        status: s.status,
        createdAt: s.createdAt,
        author: {
          id: s.author.id,
          handle: s.author.handle,
          avatarUrl: s.author.avatarUrl,
        },
      })),
      total: filtered.length,
      page,
      limit,
    };
  }

  async getSecretById(secretId: string): Promise<Secret | null> {
    return this.secretsRepo.findOne({
      where: { id: secretId },
      relations: ['author'],
    });
  }

  async updateStatus(secretId: string, status: SecretStatus): Promise<void> {
    await this.secretsRepo.update({ id: secretId }, { status });
  }
}
