import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SecretsService } from './secrets.service';
import { SecretsGateway } from './secrets.getaway';
import {
  IsOptional,
  IsString,
  IsArray,
  ArrayMaxSize,
  ArrayUnique,
} from 'class-validator';

export class CreateSecretDto {
  @IsString()
  text: string;

  // New multi-mood support (codes). Kept optional; enforce limits in service
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  moods?: string[];

  // Optional user-provided hashtags (either with or without #)
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ArrayUnique()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateSecretDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  moods?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ArrayUnique()
  @IsString({ each: true })
  tags?: string[];
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
    @Query('moods') moodsCsv?: string,
    @Query('tags') tagsCsv?: string,
    @Query('search') searchQuery?: string,
  ) {
    const pageNum = Math.max(parseInt(page, 10), 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10), 1), 100);
    const moods = moodsCsv
      ? moodsCsv
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;
    const tags = tagsCsv
      ? tagsCsv
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;
    return this.secrets.getFeed(
      req.user.userId,
      pageNum,
      limitNum,
      moods,
      tags,
      searchQuery,
    );
  }

  // GET /secrets/trending?limit=10&hours=24
  @Get('trending')
  async trending(
    @Request() req,
    @Query('limit') limit = '10',
    @Query('hours') hours = '24',
    @Query('page') page = '1',
  ) {
    const limitNum = Math.min(Math.max(parseInt(limit, 10), 1), 50);
    const hoursNum = Math.min(Math.max(parseInt(hours, 10), 1), 168); // Max 1 week
    const pageNum = Math.max(parseInt(page, 10), 1);
    return this.secrets.getTrending(
      req.user.userId,
      limitNum,
      hoursNum,
      pageNum,
    );
  }

  @Get('secretslist/me')
  async getMySecrets(
    @Request() req,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('moods') moodsCsv?: string,
    @Query('tags') tagsCsv?: string,
  ) {
    const pageNum = Math.max(parseInt(page, 10), 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10), 1), 100);
    const moods = moodsCsv
      ? moodsCsv
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;
    const tags = tagsCsv
      ? tagsCsv
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;
    return this.secrets.getSecrets(
      req.user.userId,
      pageNum,
      limitNum,
      moods,
      tags,
    );
  }

  @Get('find/:id')
  async getSecret(@Param('id') secretId: string) {
    const secret = await this.secrets.getSecretById(secretId);
    return secret;
  }

  /** PATCH /secrets/:id — edit own secret */
  @Patch(':id')
  async updateSecret(
    @Request() req,
    @Param('id') secretId: string,
    @Body() dto: UpdateSecretDto,
  ) {
    return this.secrets.updateSecret(req.user.userId, secretId, dto);
  }

  /** DELETE /secrets/:id — soft-delete own secret */
  @Delete(':id')
  async deleteSecret(@Request() req, @Param('id') secretId: string) {
    await this.secrets.deleteSecret(req.user.userId, secretId);
    return { ok: true };
  }
  @Post()
  async create(@Request() req, @Body() dto: CreateSecretDto) {
    const { userId } = req.user;
    const secret = await this.secrets.createSecret(
      userId,
      dto.text,
      dto.moods,
      dto.tags,
    );
    // Notify WebSocket client about the new secret

    this.getaway.notifyNewSecret(secret as any);
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

  /** GET /secrets/search - Enhanced search with hashtags, moods, and text */
  @Get('search')
  async search(
    @Request() req,
    @Query('q') q?: string,
    @Query('moods') moodsCsv?: string,
    @Query('tags') tagsCsv?: string,
    @Query('sort') sort?: 'newest' | 'relevant',
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const pageNum = Math.max(parseInt(page, 10), 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10), 1), 100);
    const moods = moodsCsv
      ? moodsCsv
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;
    const tags = tagsCsv
      ? tagsCsv
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;
    
    return this.secrets.searchSecrets(
      req.user.userId,
      {
        q: q?.trim(),
        moods,
        tags,
        sort: sort || 'newest',
      },
      pageNum,
      limitNum,
    );
  }
}
