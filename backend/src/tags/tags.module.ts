import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tag } from './tag.entity';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tag])],
  providers: [TagsService],
  controllers: [TagsController],
  exports: [TypeOrmModule, TagsService],
})
export class TagsModule {}
