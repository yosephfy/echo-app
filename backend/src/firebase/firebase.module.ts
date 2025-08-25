import { Module } from '@nestjs/common';
import { FirebaseAdminService } from './firebase.service';
import { FirebaseController } from './firebase.controller';

@Module({
  providers: [FirebaseAdminService],
  controllers: [FirebaseController],
  exports: [FirebaseAdminService],
})
export class FirebaseModule {}
