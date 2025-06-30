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

    // paginate
    const start = (pageNum - 1) * limitNum;
    const slice = bookmarks.slice(start, start + limitNum);

    // fetch secret details
    const items = await Promise.all(
      slice.map(async (bm) => {
        const secret = await this.secretsSvc.getSecretById(bm.secretId);
        return secret;
      }),
    );

    const total = bookmarks.length;
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
}
