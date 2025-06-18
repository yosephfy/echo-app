import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Secret } from './secret.entity';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';

const COOLDOWN_SECONDS = 24 * 60 * 60; // 24h

@Injectable()
export class SecretsService {
  constructor(
    @InjectRepository(Secret)
    private secretsRepo: Repository<Secret>,
    @Inject('REDIS') private redis: Redis,
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

    return saved;
  }

  async getCooldownSeconds(userId: string): Promise<number> {
    const ttl = await this.redis.ttl(`cooldown:${userId}`);
    // redis.ttl returns -2 if key doesn’t exist, -1 if no expiry
    return ttl > 0 ? ttl : 0;
  }

  /** Returns an array of secrets for the feed with pagination */
  async getFeed(userId: string, page: number, limit: number) {
    const [items, total] = await this.secretsRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      items: items.map((s) => ({
        id: s.id,
        text: s.text,
        mood: s.mood,
        status: s.status,
        createdAt: s.createdAt,
      })),
      total,
      page,
      limit,
    };
  }
}
