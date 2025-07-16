// backend/src/bookmarks/bookmarks.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bookmark } from './bookmark.entity';

@Injectable()
export class BookmarksService {
  constructor(@InjectRepository(Bookmark) private repo: Repository<Bookmark>) {}

  /** Toggle bookmark for a user/secret */
  async toggle(userId: string, secretId: string) {
    const existing = await this.repo.findOne({ where: { userId, secretId } });
    if (existing) {
      await this.repo.remove(existing);
      const count = await this.countForSecret(secretId);
      return { removed: true, count };
    }
    await this.repo.save(this.repo.create({ userId, secretId }));
    const count = await this.countForSecret(secretId);
    return { added: true, count };
  }

  /** List bookmarks for a user */
  async listForUser(userId: string) {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  /** Count bookmarks for a given secret */
  async countForSecret(secretId: string): Promise<number> {
    return this.repo.count({ where: { secretId } });
  }

  /** Count bookmarks for a user */
  async countForUser(userId: string): Promise<number> {
    return this.repo.count({ where: { userId } });
  }

  async isBookmarked(userId: string, secretId: string) {
    const existing = await this.repo.findOne({ where: { userId, secretId } });
    return !!existing;
  }
}
