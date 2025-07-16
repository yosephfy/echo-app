// backend/src/reply-reactions/reply-reactions.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReplyReactionsService } from './reply-reactions.service';
import { ReplyReactionType } from './reply-reaction.entity';

type ToggleDto = {
  type: ReplyReactionType;
};

@UseGuards(JwtAuthGuard)
@Controller('replies/:id/reactions')
export class ReplyReactionsController {
  constructor(private readonly svc: ReplyReactionsService) {}

  @Get()
  async getCounts(@Param('id') replyId: string) {
    return this.svc.countByReply(replyId);
  }

  @Get('me')
  async getMyReaction(@Request() req, @Param('id') replyId: string) {
    return this.svc.getForUser(req.user.userId, replyId);
  }

  @Post()
  async toggle(
    @Request() req,
    @Param('id') replyId: string,
    @Body() dto: ToggleDto,
  ) {
    const result = await this.svc.toggle(req.user.userId, replyId, dto.type);
    return {
      currentType: result.currentType,
      counts: result.counts,
    };
  }
}
