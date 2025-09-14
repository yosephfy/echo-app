import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Tag } from './tag.entity';

@Injectable()
export class TagsService {
  constructor(@InjectRepository(Tag) private readonly repo: Repository<Tag>) {}

  async list(limit = 50) {
    return this.repo.find({ order: { usageCount: 'DESC' }, take: limit });
  }

  /** Get trending hashtags based on recent usage in secrets */
  async getTrending(limit = 20, hours = 24) {
    const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Get tags that have been used in secrets within the specified hours
    const trending = await this.repo
      .createQueryBuilder('tag')
      .leftJoin('tag.secrets', 'secret')
      .where('secret.createdAt >= :hoursAgo', { hoursAgo })
      .andWhere('secret.status IN (:...statuses)', {
        statuses: ['published', 'under_review'],
      })
      .groupBy('tag.id')
      .orderBy('COUNT(secret.id)', 'DESC')
      .addOrderBy('tag.usageCount', 'DESC') // Secondary sort by overall usage
      .limit(limit)
      .getMany();

    return trending.map((tag) => ({
      tag: tag.slug,
      count: tag.usageCount, // Overall count for display
      slug: tag.slug,
      raw: tag.raw,
    }));
  }

  async search(q: string, limit = 20) {
    const slug = q?.trim().toLowerCase().replace(/^#/, '') ?? '';
    if (!slug) return [];
    return this.repo.find({
      where: { slug: Like(`${slug}%`) },
      order: { usageCount: 'DESC' },
      take: limit,
    });
  }

  async get(slug: string) {
    const s = slug?.trim().toLowerCase().replace(/^#/, '') ?? '';
    return this.repo.findOne({ where: { slug: s } });
  }
}
