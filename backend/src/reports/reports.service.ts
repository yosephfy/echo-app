import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './report.entity';
import { SecretStatus } from 'src/secrets/secret.entity';
import { SecretsService } from 'src/secrets/secrets.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private repo: Repository<Report>,
    private readonly secrets: SecretsService, // Inject SecretsService to access secret details
  ) {}

  async report(userId: string, secretId: string, reason?: string) {
    const exists = await this.repo.findOne({ where: { userId, secretId } });
    if (exists) throw new ConflictException('Already reported');
    const rep = this.repo.create({ userId, secretId, reason });
    return this.repo.save(rep);
  }

  async listPending() {
    return this.repo.find({
      relations: ['secret'],
      order: { createdAt: 'ASC' },
    });
  }

  async findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async resolve(
    id: string,
    action: 'approve' | 'remove',
  ): Promise<{ success: boolean; message: string }> {
    const report = await this.findById(id);
    if (!report) throw new Error('Report not found');

    console.log(`Resolving report ${id} with action: ${action}`);

    const status =
      action === 'approve' ? SecretStatus.PUBLISHED : SecretStatus.REMOVED;

    // IMPORTANT: await the updateStatus call
    await this.secrets.updateStatus(report.secretId, status);

    // Now delete the report itself
    await this.repo.delete(id);

    return { success: true, message: 'Report resolved successfully' };
  }
}
