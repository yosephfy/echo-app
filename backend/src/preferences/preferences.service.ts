// backend/src/preferences/preferences.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPreference } from './user-preference.entity';

@Injectable()
export class PreferencesService {
  constructor(
    @InjectRepository(UserPreference)
    private prefsRepo: Repository<UserPreference>,
  ) {}

  async getAll(userId: string) {
    const rows = await this.prefsRepo.find({ where: { userId } });
    return rows.reduce(
      (acc, { key, value }) => {
        acc[key] = JSON.parse(value);
        return acc;
      },
      {} as Record<string, any>,
    );
  }

  async upsert(userId: string, key: string, value: any) {
    const existing = await this.prefsRepo.findOne({ where: { userId, key } });
    if (existing) {
      existing.value = JSON.stringify(value);
      return this.prefsRepo.save(existing);
    }
    return this.prefsRepo.save(
      this.prefsRepo.create({ userId, key, value: JSON.stringify(value) }),
    );
  }
}
