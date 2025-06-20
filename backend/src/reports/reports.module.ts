import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModerationModule } from 'src/moderation/moderation.module';
import { ReportsService } from './reports.service';
import {
  AdminReportsController,
  ReportsController,
} from './reports.controller';
import { Report } from './report.entity';
import { SecretsService } from 'src/secrets/secrets.service';
import { SecretsModule } from 'src/secrets/secrets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report]),
    ModerationModule,
    SecretsModule,
  ],
  providers: [ReportsService],
  controllers: [ReportsController, AdminReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}
