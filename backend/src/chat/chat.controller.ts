import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';

@UseGuards(JwtAuthGuard)
@Controller('chats')
export class ChatController {
  constructor(private readonly chats: ChatService) {}

  @Get()
  async list(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.chats.listConversations(
      req.user.userId,
      Number(page),
      Number(limit),
    );
  }

  @Post('start')
  async start(@Req() req: any, @Body('peerUserId') peerUserId: string) {
    return this.chats.startOneToOne(req.user.userId, peerUserId);
  }

  @Get(':id/messages')
  async messages(
    @Req() req: any,
    @Param('id') conversationId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 30,
  ) {
    return this.chats.listMessages(
      req.user.userId,
      conversationId,
      Number(page),
      Number(limit),
    );
  }

  @Post(':id/messages')
  async send(
    @Req() req: any,
    @Param('id') conversationId: string,
    @Body()
    body: {
      body?: string;
      clientToken: string;
      attachmentUrl?: string;
      mimeType?: string;
    },
  ) {
    return this.chats.sendMessage(
      req.user.userId,
      conversationId,
      body.body ?? '',
      body.clientToken,
      body.attachmentUrl,
      body.mimeType,
    );
  }

  @Patch(':id/read')
  async markRead(
    @Req() req: any,
    @Param('id') conversationId: string,
    @Body('lastReadMessageId') lastReadMessageId: string,
  ) {
    return this.chats.markRead(
      req.user.userId,
      conversationId,
      lastReadMessageId,
    );
  }
}
