// backend/src/reply-reactions/reply-reactions.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReplyReaction } from './reply-reaction.entity';
import { ReplyReactionsService } from './reply-reactions.service';
import { ReplyReactionsController } from './reply-reactions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ReplyReaction])],
  providers: [ReplyReactionsService],
  controllers: [ReplyReactionsController],
})
export class ReplyReactionsModule {}
