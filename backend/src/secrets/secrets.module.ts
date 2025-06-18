import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Secret } from './secret.entity';
import { SecretsService } from './secrets.service';
import { SecretsController } from './secrets.controller';
import { SecretsGateway } from './secrets.getaway';

@Module({
  imports: [TypeOrmModule.forFeature([Secret])],
  providers: [SecretsService, SecretsGateway],
  controllers: [SecretsController],
  exports: [SecretsService],
})
export class SecretsModule {}
