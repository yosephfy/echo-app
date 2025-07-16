import { Module } from '@nestjs/common';
import { RepliesService } from './replies.service';
import { RepliesController } from './replies.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reply } from 'src/replies/reply.entity';
import { RepliesGateway } from './replies.gateway';

@Module({
  imports: [
    // ← Register the Reaction entity so Nest can inject its Repository
    TypeOrmModule.forFeature([Reply]),
  ],
  providers: [RepliesService, RepliesGateway],
  controllers: [RepliesController],
})
export class RepliesModule {}
