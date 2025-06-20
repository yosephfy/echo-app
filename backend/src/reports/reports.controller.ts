// backend/src/reports/report.controller.ts

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { SecretsService } from '../secrets/secrets.service';
import { SecretStatus } from '../secrets/secret.entity';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

class ReportDto {
  reason?: string;
}

type ResolveDto = {
  action: 'approve' | 'remove';
};

@UseGuards(JwtAuthGuard)
@Controller('secrets/:id/report')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  /** User reports a secret */
  @Post()
  async report(
    @Request() req,
    @Param('id') secretId: string,
    @Body() dto: ReportDto,
  ) {
    return this.reports.report(req.user.userId, secretId, dto.reason);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/reports')
export class AdminReportsController {
  constructor(
    private readonly reports: ReportsService,
    private readonly secrets: SecretsService,
  ) {}

  /** Admin lists all pending reports */
  @Get()
  async listPending() {
    return this.reports.listPending();
  }

  /**
   * Admin resolves a report: approve → publish, remove → deleted
   * action must be 'approve' or 'remove'
   */
  @Post(':id')
  async resolve(@Param('id') reportId: string, @Body() body: ResolveDto) {
    return this.reports.resolve(reportId, body.action);
  }
}
