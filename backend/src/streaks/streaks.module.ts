// backend/src/streaks/streaks.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Streak } from './streak.entity';
import { StreaksService } from './streaks.service';

@Module({
  imports: [TypeOrmModule.forFeature([Streak])],
  providers: [StreaksService],
  exports: [StreaksService],
})
export class StreaksModule {}
