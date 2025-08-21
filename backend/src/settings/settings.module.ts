import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { SettingDefinition } from './setting-definition.entity';
import { UserSettingChange } from './user-setting-change.entity';
import { UserSetting } from './user-setting.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SettingDefinition,
      UserSetting,
      UserSettingChange,
    ]),
  ],
  providers: [SettingsService],
  controllers: [SettingsController],
  exports: [SettingsService],
})
export class SettingsModule {}
