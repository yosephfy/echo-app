import { Module } from '@nestjs/common';
import { CapsService } from './caps.service';
import { CapsController } from './caps.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cap } from './cap.entity';

@Module({
  imports: [
    // ← Register the Reaction entity so Nest can inject its Repository
    TypeOrmModule.forFeature([Cap]),
  ],
  providers: [CapsService],
  controllers: [CapsController],
  exports: [CapsService], // if you want to use it elsewhere
})
export class CapsModule {}
