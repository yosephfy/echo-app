import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mood } from './mood.entity';
import { MoodsService } from './moods.service';
import { MoodsController } from './moods.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Mood])],
  providers: [MoodsService],
  controllers: [MoodsController],
  exports: [TypeOrmModule, MoodsService],
})
export class MoodsModule {}
