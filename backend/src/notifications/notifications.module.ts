// backend/src/notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { Queue } from 'bullmq';
import { RedisModule } from '../redis/redis.module';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsProcessor } from './notifications.processor';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpoToken } from './token.entity';

@Module({
  imports: [RedisModule, TypeOrmModule.forFeature([ExpoToken])],
  providers: [
    NotificationsService,
    NotificationsController,
    NotificationsProcessor,
    {
      provide: 'NOTIF_QUEUE',
      useFactory: (redisClient) =>
        new Queue('notifications', { connection: redisClient.options }),
      inject: ['REDIS'],
    },
  ],
  exports: ['NOTIF_QUEUE', NotificationsService],
})
export class NotificationsModule {}
