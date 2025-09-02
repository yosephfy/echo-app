// backend/src/replies/replies.controller.ts
import {
  UseGuards,
  Controller,
  Post,
  Param,
  Body,
  Get,
  Query,
  Request,
  Patch,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RepliesService } from './replies.service';

type CreateReplyDto = {
  text: string;
};

@UseGuards(JwtAuthGuard)
@Controller('secrets/:id/replies')
export class RepliesController {
  constructor(private readonly svc: RepliesService) {}

  /** POST /secrets/:id/replies */
  @Post()
  async create(
    @Request() req,
    @Param('id') secretId: string,
    @Body() dto: CreateReplyDto,
  ) {
    return this.svc.create(req.user.userId, secretId, dto.text);
  }

  /** GET /secrets/:id/replies?page=1&limit=20 */
  @Get()
  async list(
    @Param('id') secretId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const pageNum = Math.max(parseInt(page, 10), 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10), 1), 100);
    return this.svc.list(secretId, pageNum, limitNum);
  }

  /** PATCH /secrets/:id/replies/:replyId — edit own reply */
  @Patch(':replyId')
  async update(
    @Request() req,
    @Param('id') secretId: string,
    @Param('replyId') replyId: string,
    @Body() dto: CreateReplyDto,
  ) {
    return this.svc.update(req.user.userId, secretId, replyId, dto.text);
  }

  /** DELETE /secrets/:id/replies/:replyId — delete own reply */
  @Delete(':replyId')
  async remove(
    @Request() req,
    @Param('id') secretId: string,
    @Param('replyId') replyId: string,
  ) {
    await this.svc.remove(req.user.userId, secretId, replyId);
    return { ok: true };
  }
}
