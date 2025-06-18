import {
  UseGuards,
  Controller,
  Post,
  Param,
  Body,
  Get,
  Query,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RepliesService } from './replies.service';

@UseGuards(JwtAuthGuard)
@Controller('secrets/:id/replies')
export class RepliesController {
  constructor(private svc: RepliesService) {}

  @Post()
  async create(
    @Request() req,
    @Param('id') secretId: string,
    @Body('text') text: string,
  ) {
    return this.svc.create(req.user.userId, secretId, text);
  }

  @Get()
  async list(@Param('id') secretId: string, @Query('page') page = '1') {
    const pageNum = Math.max(parseInt(page, 10), 1);
    return this.svc.list(secretId, pageNum);
  }
}
