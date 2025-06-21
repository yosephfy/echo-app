import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Secret } from './secret.entity';
import { SecretsService } from './secrets.service';
import { SecretsController } from './secrets.controller';
import { SecretsGateway } from './secrets.getaway';
import { ModerationModule } from 'src/moderation/moderation.module';
import { ReportsModule } from 'src/reports/reports.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Secret]), NotificationsModule],
  providers: [SecretsService, SecretsGateway],
  controllers: [SecretsController],
  exports: [SecretsService],
})
export class SecretsModule {}
