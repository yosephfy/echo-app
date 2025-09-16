import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Reaction, ReactionType } from './reaction.entity';
import { Secret } from 'src/secrets/secret.entity';
import {
  toSecretItemDto,
  SecretItemDto,
} from 'src/secrets/dtos/secret-item.dto';

@Injectable()
export class ReactionsService {
  constructor(@InjectRepository(Reaction) private repo: Repository<Reaction>) {}

  /** Toggle or switch this user's reaction type on a secret */
  async toggle(
    userId: string,
    secretId: string,
    type: ReactionType,
  ): Promise<{
    currentType: ReactionType | null;
    counts: Record<ReactionType, number>;
  }> {
    // Find existing for this user+secret
    const existing = await this.repo.findOne({ where: { userId, secretId } });
    if (existing) {
      if (existing.type === type) {
        // remove
        await this.repo.remove(existing);
        return {
          currentType: null,
          counts: await this.countAll(secretId),
        };
      }
      // switch
      existing.type = type;
      await this.repo.save(existing);
      return {
        currentType: type,
        counts: await this.countAll(secretId),
      };
    }
    // new reaction
    const reaction = this.repo.create({ userId, secretId, type });
    await this.repo.save(reaction);
    return {
      currentType: type,
      counts: await this.countAll(secretId),
    };
  }

  /** Count how many of each reaction type a secret has */
  async countAll(secretId: string): Promise<Record<ReactionType, number>> {
    const counts: Record<ReactionType, number> = {
      [ReactionType.Like]: 0,
      [ReactionType.Love]: 0,
      [ReactionType.Haha]: 0,
      [ReactionType.Wow]: 0,
      [ReactionType.Sad]: 0,
    };
    const raw = await this.repo
      .createQueryBuilder('r')
      .select('r.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('r.secretId = :secretId', { secretId })
      .groupBy('r.type')
      .getRawMany<{ type: ReactionType; count: string }>();
    raw.forEach((row) => {
      counts[row.type] = parseInt(row.count, 10);
    });
    return counts;
  }

  /** Get this user's current reaction (if any) and all counts */
  async getForUser(
    userId: string,
    secretId: string,
  ): Promise<{
    currentType: ReactionType | null;
    counts: Record<ReactionType, number>;
  }> {
    const existing = await this.repo.findOne({ where: { userId, secretId } });
    const counts = await this.countAll(secretId);
    return {
      currentType: existing?.type ?? null,
      counts,
    };
  }

  /** Get paginated list of secrets the user has reacted to */
  async getSecretsUserReactedTo(
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

    // Step 1: get the latest reacted secret IDs ordered by reaction.createdAt
    const reacted = await this.repo
      .createQueryBuilder('r')
      .select(['r.secretId AS secretId'])
      .addSelect('MAX(r.createdAt)', 'lastReactedAt')
      .innerJoin(
        Secret,
        's',
        's.id = r.secretId AND s.status IN (:...status) AND (s.userId IS NULL OR s.userId <> :userId)',
        {
          status: ['published', 'under_review'] as any,
          userId,
        },
      )
      .where('r.userId = :userId', { userId })
      .groupBy('r.secretId')
      .orderBy('MAX(r.createdAt)', 'DESC')
      .offset(offset)
      .limit(limit)
      .getRawMany<{ secretid: string; lastReactedAt: string }>();

    // total distinct secrets reacted to by this user
    const totalRes = await this.repo
      .createQueryBuilder('r')
      .innerJoin(
        Secret,
        's',
        's.id = r.secretId AND s.status IN (:...status) AND (s.userId IS NULL OR s.userId <> :userId)',
        {
          status: ['published', 'under_review'] as any,
          userId,
        },
      )
      .select('COUNT(DISTINCT r.secretId)', 'total')
      .where('r.userId = :userId', { userId })
      .getRawOne<{ total: string }>();
    const total = parseInt(totalRes?.total || '0', 10);

    const ids = reacted.map((r) => r.secretid);
    if (ids.length === 0) return { items: [], total, page, limit };

    // Step 2: load secrets with relations and allowed statuses
    const secrets = await this.repo.manager.getRepository(Secret).find({
      where: { id: In(ids), status: In(['published', 'under_review'] as any) },
      relations: ['author', 'moods', 'tags'],
    });

    // Preserve ordering
    const order = new Map(ids.map((id, idx) => [id, idx] as const));
    secrets.sort((a, b) => order.get(a.id)! - order.get(b.id)!);

    const items = secrets.map((s) => toSecretItemDto(s));
    return { items, total, page, limit };
  }
}
