import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reply } from './reply.entity';

@Injectable()
export class RepliesService {
  constructor(@InjectRepository(Reply) private repo: Repository<Reply>) {}

  async create(userId: string, secretId: string, text: string) {
    const reply = this.repo.create({ userId, secretId, text });
    return this.repo.save(reply);
  }

  async list(secretId: string, page = 1, limit = 20) {
    return this.repo.find({
      where: { secretId },
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
