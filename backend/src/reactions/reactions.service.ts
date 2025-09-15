import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reaction, ReactionType } from './reaction.entity';

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
    limit: number = 20
  ): Promise<{
    items: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const offset = (page - 1) * limit;
    
    // Get distinct secrets with latest reaction date for ordering
    const query = this.repo
      .createQueryBuilder('reaction')
      .innerJoinAndSelect('reaction.secret', 'secret')
      .innerJoinAndSelect('secret.author', 'author')
      .leftJoinAndSelect('secret.moods', 'moods')
      .leftJoinAndSelect('secret.tags', 'tags')
      .where('reaction.userId = :userId', { userId })
      .andWhere('secret.status IN (:...statuses)', { statuses: ['published', 'under_review'] })
      .orderBy('reaction.createdAt', 'DESC')
      .take(limit)
      .skip(offset);

    const [reactions, total] = await query.getManyAndCount();

    // Build response with reaction counts for each secret
    const items = await Promise.all(
      reactions.map(async (reaction) => {
        const reactionsCount = await this.countAll(reaction.secret.id);
        const totalReactions = Object.values(reactionsCount).reduce((sum, count) => sum + count, 0);
        
        return {
          secret: reaction.secret,
          reactionsCount: totalReactions,
          reactionType: reaction.type,
          reactedAt: reaction.createdAt,
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
