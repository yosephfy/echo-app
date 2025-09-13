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
