// backend/src/reactions/reactions.controller.ts
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
import { ReactionsService } from './reactions.service';
import { ReactionType } from './reaction.entity';

type ToggleDto = {
  type: ReactionType;
};

@UseGuards(JwtAuthGuard)
@Controller('secrets/:id/reactions')
export class ReactionsController {
  constructor(private readonly svc: ReactionsService) {}

  /** 1) Get counts for all reaction types */
  @Get()
  async getCounts(@Param('id') secretId: string) {
    return this.svc.countAll(secretId);
  }

  /** 2) Get current user's reaction on this secret */
  @Get('me')
  async getMyReaction(@Request() req, @Param('id') secretId: string) {
    const { currentType } = await this.svc.getForUser(
      req.user.userId,
      secretId,
    );
    return { type: currentType };
  }

  /** 3) Toggle or switch reaction for the current user */
  @Post()
  async toggle(
    @Request() req,
    @Param('id') secretId: string,
    @Body() dto: ToggleDto,
  ) {
    console.log(dto);
    const result = await this.svc.toggle(req.user.userId, secretId, dto.type);
    // return updated status and counts
    return {
      currentType: result.currentType,
      counts: result.counts,
    };
  }
}
