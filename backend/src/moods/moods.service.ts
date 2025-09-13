import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mood } from './mood.entity';

@Injectable()
export class MoodsService {
  constructor(
    @InjectRepository(Mood) private readonly repo: Repository<Mood>,
  ) {}

  async list(activeOnly = true) {
    return this.repo.find({
      where: activeOnly ? { active: true } : {},
      order: { code: 'ASC' },
    });
  }

  async getByCode(code: string) {
    return this.repo.findOne({ where: { code } });
  }
}
