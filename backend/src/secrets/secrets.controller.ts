import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SecretsService } from './secrets.service';
import { IsOptional, IsString } from 'class-validator';
import { SecretsGateway } from './secrets.getaway';

export class CreateSecretDto {
  @IsString()
  text: string;

  @IsOptional()
  @IsString()
  mood?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('secrets')
export class SecretsController {
  constructor(
    private secrets: SecretsService,
    private getaway: SecretsGateway,
  ) {}
  // GET /secrets/feed?page=1&limit=20
  @Get('feed')
  async feed(
    @Request() req,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('mood') mood?: string, // new
  ) {
    const pageNum = Math.max(parseInt(page, 10), 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10), 1), 100);
    return this.secrets.getFeed(req.user.userId, pageNum, limitNum, mood);
  }

  @Get('find/:id')
  async getSecret(@Param('id') secretId: string) {
    const secret = await this.secrets.getSecretById(secretId);
    return secret;
  }
  @Post()
  async create(@Request() req, @Body() dto: CreateSecretDto) {
    const { userId } = req.user;
    const secret = await this.secrets.createSecret(userId, dto.text, dto.mood);
    // Notify WebSocket client about the new secret

    this.getaway.notifyNewSecret(secret);
    // Return minimal view
    return secret;
  }

  @Get('quota')
  async getQuota(@Request() req) {
    const seconds = await this.secrets.getCooldownSeconds(req.user.userId);
    return { secondsRemaining: seconds };
  }

  /** GET /secrets/cooldown */
  @Get('cooldown')
  async getCooldown(@Request() req) {
    // returns { start: Date, duration: number, remaining: number }
    return this.secrets.getCooldownInfo(req.user.userId);
  }
}
