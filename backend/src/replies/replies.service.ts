// backend/src/replies/replies.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reply } from './reply.entity';
import { RepliesGateway } from './replies.gateway';

const DEFAULT_LIMIT = 20;

@Injectable()
export class RepliesService {
  constructor(
    @InjectRepository(Reply) private repo: Repository<Reply>,
    private readonly gateway: RepliesGateway,
  ) {}

  /** Create a new reply, then broadcast it */
  async create(userId: string, secretId: string, text: string) {
    // save
    const reply = this.repo.create({ userId, secretId, text });
    const saved = await this.repo.save(reply);

    // reload with author relation
    const full: any = await this.repo.findOne({
      where: { id: saved.id },
      relations: ['author'],
    });

    // prepare a clean DTO
    const dto = {
      id: full.id,
      text: full.text,
      createdAt: full.createdAt,
      author: {
        id: full.author.id,
        handle: full.author.handle,
        avatarUrl: full.author.avatarUrl,
      },
    };

    // emit real-time
    this.gateway.notifyNewReply(secretId, dto);

    return dto;
  }

  /** List replies with pagination */
  async list(
    secretId: string,
    page = 1,
    limit = DEFAULT_LIMIT,
  ): Promise<{
    items: Array<{
      id: string;
      secretId: string;
      text: string;
      createdAt: Date;
      author: { id: string; handle: string; avatarUrl?: string };
    }>;
    total: number;
    page: number;
    limit: number;
  }> {
    const rows = await this.repo.find({
      where: { secretId },
      relations: ['author'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    /* const items = rows.map((r) => ({
      id: r.id,
      text: r.text,
      createdAt: r.createdAt,
      author: {
        id: r.author.id,
        handle: r.author.handle,
        avatarUrl: r.author.avatarUrl,
      },
    })); */
    const items = rows.map((r) => ({ ...r, secretId }));
    const total = await this.repo.count({ where: { secretId } });
    return { items, total, page, limit };
  }
}
