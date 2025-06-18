import { Controller, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ReactionsService } from './reactions.service';
@UseGuards(JwtAuthGuard)
@Controller('secrets/:id/reactions')
export class ReactionsController {
  constructor(private svc: ReactionsService) {}

  @Post()
  async toggle(@Request() req, @Param('id') secretId: string) {
    const result = await this.svc.toggle(req.user.userId, secretId);
    const count = await this.svc.count(secretId);
    return { ...result, count };
  }
}
