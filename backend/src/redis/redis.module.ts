import { Module, Global, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS',
      useFactory: () => {
        const logger = new Logger('Redis');
        const url = process.env.REDIS_URL || 'redis://localhost:6379';
        const redis = new Redis(url, {
          lazyConnect: true,
          enableOfflineQueue: false,
        });

        redis.on('error', (err) => {
          logger.error(`Redis error: ${err?.message ?? err}`);
        });

        return redis;
      },
    },
  ],
  exports: ['REDIS'],
})
export class RedisModule {}
