// backend/src/caps/user-caps.controller.ts
import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CapsService } from './caps.service';

@UseGuards(JwtAuthGuard)
@Controller('caps')
export class UserCapsController {
  constructor(private readonly capsService: CapsService) {}

  /** GET /caps/me?page&limit - get paginated secrets user has capped */
  @Get('me')
  async getMyCaps(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    // Ensure sensible limits
    const safePage = Math.max(1, pageNum);
    const safeLimit = Math.min(Math.max(1, limitNum), 100);

    return this.capsService.getSecretsUserCapped(
      req.user.userId,
      safePage,
      safeLimit,
    );
  }
}
