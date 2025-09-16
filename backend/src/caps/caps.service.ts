// backend/src/caps/caps.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Cap } from './cap.entity';
import { Secret } from 'src/secrets/secret.entity';
import {
  SecretItemDto,
  toSecretItemDto,
} from 'src/secrets/dtos/secret-item.dto';

@Injectable()
export class CapsService {
  constructor(
    @InjectRepository(Cap)
    private repo: Repository<Cap>,
  ) {}

  /** Toggle user's cap on a secret */
  async toggle(
    userId: string,
    secretId: string,
  ): Promise<{ hasCapped: boolean; count: number }> {
    const existing = await this.repo.findOne({ where: { userId, secretId } });
    if (existing) {
      await this.repo.remove(existing);
      const newCount = await this.count(secretId);
      return { hasCapped: false, count: newCount };
    }
    await this.repo.save(this.repo.create({ userId, secretId }));
    const newCount = await this.count(secretId);
    return { hasCapped: true, count: newCount };
  }

  /** Total caps for a secret */
  async count(secretId: string): Promise<number> {
    return this.repo.count({ where: { secretId } });
  }

  /** Did this user cap this secret? */
  async me(userId: string, secretId: string): Promise<boolean> {
    const existing = await this.repo.findOne({ where: { userId, secretId } });
    return !!existing;
  }

  /** Get paginated list of secrets the user has capped */
  async getSecretsUserCapped(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    items: SecretItemDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const offset = (page - 1) * limit;

    // Step 1: get latest capped secret IDs order by cap.createdAt
    const capped = await this.repo
      .createQueryBuilder('c')
      .select(['c.secretId AS secretId'])
      .addSelect('MAX(c.createdAt)', 'lastCappedAt')
      .innerJoin(
        Secret,
        's',
        's.id = c.secretId AND s.status IN (:...status) AND (s.userId IS NULL OR s.userId <> :userId)',
        {
          status: ['published', 'under_review'] as any,
          userId,
        },
      )
      .where('c.userId = :userId', { userId })
      .groupBy('c.secretId')
      .orderBy('MAX(c.createdAt)', 'DESC')
      .offset(offset)
      .limit(limit)
      .getRawMany<{ secretid: string; lastCappedAt: string }>();

    // total distinct secrets capped by this user
    const totalRes = await this.repo
      .createQueryBuilder('c')
      .innerJoin(
        Secret,
        's',
        's.id = c.secretId AND s.status IN (:...status) AND (s.userId IS NULL OR s.userId <> :userId)',
        {
          status: ['published', 'under_review'] as any,
          userId,
        },
      )
      .select('COUNT(DISTINCT c.secretId)', 'total')
      .where('c.userId = :userId', { userId })
      .getRawOne<{ total: string }>();
    const total = parseInt(totalRes?.total || '0', 10);

    const ids = capped.map((c) => c.secretid);
    if (ids.length === 0) return { items: [], total, page, limit };

    const secrets = await this.repo.manager.getRepository(Secret).find({
      where: { id: In(ids), status: In(['published', 'under_review'] as any) },
      relations: ['author', 'moods', 'tags'],
    });

    const order = new Map(ids.map((id, idx) => [id, idx] as const));
    secrets.sort((a, b) => order.get(a.id)! - order.get(b.id)!);

    const items = secrets.map((s) => toSecretItemDto(s));
    return { items, total, page, limit };
  }
}
