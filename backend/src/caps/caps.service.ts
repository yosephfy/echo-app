// backend/src/caps/caps.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cap } from './cap.entity';

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
    limit: number = 20
  ): Promise<{
    items: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const offset = (page - 1) * limit;

    // Get secrets with cap date for ordering
    const query = this.repo
      .createQueryBuilder('cap')
      .innerJoinAndSelect('cap.secret', 'secret')
      .innerJoinAndSelect('secret.author', 'author')
      .leftJoinAndSelect('secret.moods', 'moods')
      .leftJoinAndSelect('secret.tags', 'tags')
      .where('cap.userId = :userId', { userId })
      .andWhere('secret.status IN (:...statuses)', { statuses: ['published', 'under_review'] })
      .orderBy('cap.createdAt', 'DESC')
      .take(limit)
      .skip(offset);

    const [caps, total] = await query.getManyAndCount();

    // Build response with reaction counts for each secret
    const items = await Promise.all(
      caps.map(async (cap) => {
        const capsCount = await this.count(cap.secret.id);
        
        return {
          secret: cap.secret,
          reactionsCount: capsCount, // keeping consistent naming with reactions endpoint
          cappedAt: cap.createdAt,
        };
      })
    );

    return {
      items,
      total,
      page,
      limit,
    };
  }
}
