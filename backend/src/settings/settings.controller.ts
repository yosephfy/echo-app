import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SettingsService } from './settings.service';
import { UpsertDefinitionDto, UpdateDefinitionDto } from './dto/definition.dto';
import {
  SetUserSettingDto,
  BulkSetUserSettingsDto,
  ListAuditQueryDto,
} from './dto/user-setting.dto';

@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly svc: SettingsService) {}

  // -------- Definitions (admin-only in real life) --------
  @Get('definitions')
  listDefinitions(@Query('section') section?: string) {
    return this.svc.listDefinitions(section);
  }

  @Post('definitions')
  upsertDefinition(@Body() dto: UpsertDefinitionDto) {
    return this.svc.upsertDefinition(dto);
  }

  @Patch('definitions/:key')
  updateDefinition(
    @Param('key') key: string,
    @Body() dto: UpdateDefinitionDto,
  ) {
    return this.svc.updateDefinition(key, dto);
  }

  // -------- User settings (current user) --------
  /** Effective (defaults + overrides) for the authenticated user */
  @Get('me')
  getMeEffective(@Request() req) {
    return this.svc.getEffectiveUserSettings(req.user.userId);
  }

  /** Raw overrides for the authenticated user */
  @Get('me/raw')
  getMeRaw(@Request() req) {
    return this.svc.getRawUserSettings(req.user.userId);
  }

  /** Set a single setting for the authenticated user */
  @Patch('me')
  setMeSetting(@Request() req, @Body() dto: SetUserSettingDto) {
    return this.svc.setUserSetting(req.user.userId, req.user.userId, dto);
  }

  /** Bulk set multiple settings for the authenticated user */
  @Patch('me/bulk')
  bulkSetMeSettings(@Request() req, @Body() body: BulkSetUserSettingsDto) {
    return this.svc.bulkSetUserSettings(req.user.userId, req.user.userId, body);
  }

  /** Audit trail for the authenticated user */
  @Get('me/audit')
  getMeAudit(@Request() req, @Query() q: ListAuditQueryDto) {
    return this.svc.listAudit(
      req.user.userId,
      q.key,
      q.page ?? 1,
      q.limit ?? 20,
    );
  }

  // -------- Admin-style endpoints (optionally) --------
  /** Effective settings for a given user (admin) */
  @Get('user/:userId')
  getEffectiveForUser(@Param('userId') userId: string) {
    return this.svc.getEffectiveUserSettings(userId);
  }

  /** Update a specific user (admin) */
  @Patch('user/:userId')
  setForUser(
    @Request() req,
    @Param('userId') userId: string,
    @Body() dto: SetUserSettingDto,
  ) {
    return this.svc.setUserSetting(req.user.userId, userId, dto);
  }

  @Patch('user/:userId/bulk')
  bulkSetForUser(
    @Request() req,
    @Param('userId') userId: string,
    @Body() body: BulkSetUserSettingsDto,
  ) {
    return this.svc.bulkSetUserSettings(req.user.userId, userId, body);
  }

  @Get('user/:userId/audit')
  getAuditForUser(
    @Param('userId') userId: string,
    @Query() q: ListAuditQueryDto,
  ) {
    return this.svc.listAudit(userId, q.key, q.page ?? 1, q.limit ?? 20);
  }
}
