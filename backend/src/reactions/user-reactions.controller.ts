// backend/src/reactions/user-reactions.controller.ts
import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReactionsService } from './reactions.service';

@UseGuards(JwtAuthGuard)
@Controller('reactions')
export class UserReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  /** GET /reactions/me?page&limit - get paginated secrets user has reacted to */
  @Get('me')
  async getMyReactions(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    // Ensure sensible limits
    const safePage = Math.max(1, pageNum);
    const safeLimit = Math.min(Math.max(1, limitNum), 100);

    return this.reactionsService.getSecretsUserReactedTo(
      req.user.userId,
      safePage,
      safeLimit,
    );
  }
}
