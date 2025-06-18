import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reaction } from './reaction.entity';

@Injectable()
export class ReactionsService {
  constructor(@InjectRepository(Reaction) private repo: Repository<Reaction>) {}

  async toggle(userId: string, secretId: string) {
    const existing = await this.repo.findOne({ where: { userId, secretId } });
    if (existing) {
      await this.repo.remove(existing);
      return { removed: true };
    }
    await this.repo.save(this.repo.create({ userId, secretId }));
    return { added: true };
  }

  async count(secretId: string) {
    return this.repo.count({ where: { secretId } });
  }
}
