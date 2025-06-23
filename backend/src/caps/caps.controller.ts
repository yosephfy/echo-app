// backend/src/caps/caps.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CapsService } from './caps.service';

@Controller('secrets/:id/cap')
@UseGuards(JwtAuthGuard)
export class CapsController {
  constructor(private readonly caps: CapsService) {}

  /** 1) GET count only */
  @Get()
  async getCount(@Param('id') secretId: string) {
    const count = await this.caps.count(secretId);
    return { count };
  }

  /** 2) GET me only */
  @Get('me')
  async getMyCap(@Request() req, @Param('id') secretId: string) {
    const hasCapped = await this.caps.me(req.user.userId, secretId);
    return { hasCapped };
  }

  /** 3) POST toggle */
  @Post()
  async toggle(@Request() req, @Param('id') secretId: string) {
    return this.caps.toggle(req.user.userId, secretId);
  }
}
