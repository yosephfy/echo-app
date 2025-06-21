// backend/src/streaks/streaks.controller.ts
import {
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StreaksService } from './streaks.service';

// Optional: if you want to restrict the run endpoint to dev only
const isDev = process.env.NODE_ENV !== 'production';

@UseGuards(JwtAuthGuard)
@Controller('streaks')
export class StreaksController {
  constructor(private readonly streaksService: StreaksService) {}

  /** Admin/dev: List all user streaks */
  @Get()
  async listAll() {
    return this.streaksService.findAll(); // implement in service if not yet
  }

  /** Get the current user's streak */
  @Get('me')
  async getMine(@Request() req) {
    return this.streaksService.findByUserId(req.user.userId);
  }

  /**
   * Manually trigger the daily streak calculation.
   * Useful for testing; in production you can protect or disable this.
   */
  @Post('run')
  @HttpCode(HttpStatus.NO_CONTENT)
  async runCron() {
    if (!isDev) {
      // prevent manual runs in prod
      return;
    }
    await this.streaksService.handleCron();
  }
}
