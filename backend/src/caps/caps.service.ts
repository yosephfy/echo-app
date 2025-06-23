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
}
