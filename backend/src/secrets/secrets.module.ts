import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Secret } from './secret.entity';
import { Mood } from 'src/moods/mood.entity';
import { Tag } from 'src/tags/tag.entity';
import { Reaction } from 'src/reactions/reaction.entity';
import { SecretsService } from './secrets.service';
import { SecretsController } from './secrets.controller';
import { SecretsGateway } from './secrets.getaway';
import { ModerationModule } from 'src/moderation/moderation.module';
import { ReportsModule } from 'src/reports/reports.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Secret, Mood, Tag, Reaction]),
    NotificationsModule,
    DatabaseModule,
  ],
  providers: [SecretsService, SecretsGateway],
  controllers: [SecretsController],
  exports: [SecretsService],
})
export class SecretsModule {}
