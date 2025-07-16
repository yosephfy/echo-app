// backend/src/reply-reactions/reply-reactions.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReplyReaction, ReplyReactionType } from './reply-reaction.entity';

type ToggleResult = {
  added?: boolean;
  removed?: boolean;
  counts: Record<ReplyReactionType, number>;
  currentType: ReplyReactionType | null;
};

@Injectable()
export class ReplyReactionsService {
  constructor(
    @InjectRepository(ReplyReaction)
    private repo: Repository<ReplyReaction>,
  ) {}

  async countByReply(
    replyId: string,
  ): Promise<Record<ReplyReactionType, number>> {
    const counts: Record<ReplyReactionType, number> = {
      [ReplyReactionType.Like]: 0,
      [ReplyReactionType.Love]: 0,
      [ReplyReactionType.Haha]: 0,
      [ReplyReactionType.Wow]: 0,
      [ReplyReactionType.Sad]: 0,
    };
    const rows = await this.repo
      .createQueryBuilder('r')
      .select('r.type', 'type')
      .addSelect('COUNT(r.id)', 'count')
      .where('r.replyId = :replyId', { replyId })
      .groupBy('r.type')
      .getRawMany<{ type: ReplyReactionType; count: string }>();
    rows.forEach((row) => {
      counts[row.type] = parseInt(row.count, 10);
    });
    return counts;
  }

  async getForUser(
    userId: string,
    replyId: string,
  ): Promise<{ currentType: ReplyReactionType | null }> {
    const existing = await this.repo.findOne({ where: { userId, replyId } });
    return { currentType: existing?.type ?? null };
  }

  async toggle(
    userId: string,
    replyId: string,
    type: ReplyReactionType,
  ): Promise<ToggleResult> {
    const existing = await this.repo.findOne({ where: { userId, replyId } });
    if (existing) {
      if (existing.type === type) {
        await this.repo.remove(existing);
        const counts = await this.countByReply(replyId);
        return { removed: true, counts, currentType: null };
      }
      // switch type
      existing.type = type;
      await this.repo.save(existing);
    } else {
      const reaction = this.repo.create({ userId, replyId, type });
      await this.repo.save(reaction);
    }
    const counts = await this.countByReply(replyId);
    return { added: true, counts, currentType: type };
  }
}
