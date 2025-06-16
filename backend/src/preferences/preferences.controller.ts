// backend/src/preferences/preferences.controller.ts
import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PreferencesService } from './preferences.service';

class UpdatePrefsDto {
  darkMode?: boolean;
  notifyCooldown?: boolean;
  notifyUnderReview?: boolean;
  language?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('preferences')
export class PreferencesController {
  constructor(private prefs: PreferencesService) {}

  @Get()
  get(@Request() req) {
    return this.prefs.getAll(req.user.userId);
  }

  @Patch()
  update(@Request() req, @Body() dto: UpdatePrefsDto) {
    const ops = Object.entries(dto).map(([k, v]) =>
      this.prefs.upsert(req.user.userId, k, v),
    );
    return Promise.all(ops);
  }
}
