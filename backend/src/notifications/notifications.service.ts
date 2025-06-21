import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpoToken } from './token.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(ExpoToken)
    private readonly repo: Repository<ExpoToken>,
  ) {}

  /** Store or update an Expo push token for a user */
  async register(userId: string, token: string): Promise<ExpoToken> {
    // Upsert by unique (userId, token) combination
    let record = await this.repo.findOne({ where: { userId, token } });
    if (!record) {
      record = this.repo.create({ userId, token });
      await this.repo.save(record);
    }
    return record;
  }

  /** Retrieve all tokens for a user */
  async getTokensForUser(userId: string): Promise<ExpoToken[]> {
    return this.repo.find({ where: { userId } });
  }
}
