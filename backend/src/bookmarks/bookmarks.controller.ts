// backend/src/bookmarks/bookmarks.controller.ts
import {
  Controller,
  Post,
  Param,
  Get,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BookmarksService } from './bookmarks.service';
import { SecretsService } from '../secrets/secrets.service';

@UseGuards(JwtAuthGuard)
@Controller('bookmarks')
export class BookmarksController {
  constructor(
    private readonly svc: BookmarksService,
    private readonly secretsSvc: SecretsService,
  ) {}

  /** Toggle bookmark on a secret */
  @Post(':secretId')
  @HttpCode(HttpStatus.OK)
  async toggle(@Request() req, @Param('secretId') secretId: string) {
    return this.svc.toggle(req.user.userId, secretId);
  }

  /** Get list of user's bookmarks with secret details */
  @Get()
  async list(
    @Request() req,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const userId = req.user.userId;
    const pageNum = Math.max(parseInt(page, 10), 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10), 1), 100);
    const bookmarks = await this.svc.listForUser(userId);
    const total = bookmarks.length; // total bookmarks

    // paginate ids then load in batch
    const start = (pageNum - 1) * limitNum;
    const ids = bookmarks.slice(start, start + limitNum).map((b) => b.secretId);
    if (ids.length === 0)
      return { items: [], total, page: pageNum, limit: limitNum };

    // Use secrets service to fetch normalized secrets; preserve order
    const secrets = await (this.secretsSvc as any).getSecretsByIds(ids);
    const order = new Map(ids.map((id, idx) => [id, idx] as const));
    secrets.sort((a, b) => order.get(a.id)! - order.get(b.id)!);

    const { toSecretItemDto } = await import('../secrets/dtos/secret-item.dto');
    const items = secrets.map((s: any) => toSecretItemDto(s));
    return { items, total, page: pageNum, limit: limitNum };
  }

  /** Get count of bookmarks for a secret */
  @Get('secret/:secretId/count')
  async countForSecret(@Param('secretId') secretId: string) {
    const count = await this.svc.countForSecret(secretId);
    return { secretId, count };
  }

  /** Get count of user's bookmarks */
  @Get('me/count')
  async countForUser(@Request() req) {
    const count = await this.svc.countForUser(req.user.userId);
    return { userId: req.user.userId, count };
  }

  @Get(':secretId/me')
  async isBookmarked(@Request() req, @Param('secretId') secretId: string) {
    const bookmarked = await this.svc.isBookmarked(req.user.userId, secretId);
    return { bookmarked };
  }
}
