// backend/src/preferences/preferences.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PreferencesService } from './preferences.service';
import { PreferencesController } from './preferences.controller';
import { UserPreference } from './user-preference.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserPreference])],
  providers: [PreferencesService],
  controllers: [PreferencesController],
  exports: [PreferencesService],
})
export class PreferencesModule {}
