import { Module } from '@nestjs/common';
import { ReactionsService } from './reactions.service';
import { ReactionsController } from './reactions.controller';
import { UserReactionsController } from './user-reactions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reaction } from './reaction.entity';

@Module({
  imports: [
    // ← Register the Reaction entity so Nest can inject its Repository
    TypeOrmModule.forFeature([Reaction]),
  ],
  providers: [ReactionsService],
  controllers: [ReactionsController, UserReactionsController],
  exports: [ReactionsService],
})
export class ReactionsModule {}
