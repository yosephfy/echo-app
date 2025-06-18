import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bookmark } from './bookmark.entity';

@Injectable()
export class BookmarksService {
  constructor(@InjectRepository(Bookmark) private repo: Repository<Bookmark>) {}

  async toggle(userId: string, secretId: string) {
    const existing = await this.repo.findOne({ where: { userId, secretId } });
    if (existing) {
      await this.repo.remove(existing);
      return { removed: true };
    }
    await this.repo.save(this.repo.create({ userId, secretId }));
    return { added: true };
  }

  async list(userId: string) {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }
}
