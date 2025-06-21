// backend/src/streaks/streaks.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Streak } from './streak.entity';
import { StreaksService } from './streaks.service';
import { StreaksController } from './streaks.controller';
import { Secret } from '../secrets/secret.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Streak, Secret])],
  providers: [StreaksService],
  controllers: [StreaksController],
  exports: [StreaksService],
})
export class StreaksModule {}
