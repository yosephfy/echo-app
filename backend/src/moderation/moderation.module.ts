// backend/src/moderation/moderation.module.ts

import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { SecretsModule } from '../secrets/secrets.module';
import { ModerationProcessor } from './moderation.processor';

@Global()
@Module({
  imports: [
    ConfigModule,
    SecretsModule, // <— brings in SecretsService & repository
  ],
  providers: [
    {
      provide: 'MOD_QUEUE',
      useFactory: (config: ConfigService) => {
        return new Queue('moderation', {
          connection: { url: config.get<string>('REDIS_URL') },
        });
      },
      inject: [ConfigService],
    },
    ModerationProcessor, // <— will receive SecretsService via injection
  ],
  exports: ['MOD_QUEUE', ModerationProcessor],
})
export class ModerationModule {}
