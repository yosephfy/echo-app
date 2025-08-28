import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // adjust path
import { PaginationDto } from './dto/pagination.dto';
import { StartChatDto } from './dto/start-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { MarkReadDto } from './dto/mark-read.dto';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post('start')
  async start(@Req() req: any, @Body() dto: StartChatDto) {
    return this.chat.startOneToOne(req.user.id, dto.peerUserId);
  }

  @Get()
  async list(
    @Req() req: any,
    @Query() { page = 1, limit = 20 }: PaginationDto,
  ) {
    return this.chat.listConversations(req.user.id, page, limit);
  }

  // chat.controller.ts
  @Get(':id/messages')
  async messages(
    @Req() req: any,
    @Param('id') conversationId: string,
    @Query() { page = 1, limit = 30 }: PaginationDto,
  ) {
    // returns OLDEST -> NEWEST (forward scroll)
    return this.chat.listMessages(req.user.id, conversationId, page, limit);
  }

  @Post(':id/messages')
  async send(
    @Req() req: any,
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    const msg = await this.chat.sendMessage(
      req.user.id,
      conversationId,
      dto.body,
      dto.clientToken,
      dto.attachmentUrl,
      dto.mimeType,
    );
    return msg;
  }

  @Patch(':id/read')
  async markRead(
    @Req() req: any,
    @Param('id') conversationId: string,
    @Body() dto: MarkReadDto,
  ) {
    return this.chat.markRead(
      req.user.id,
      conversationId,
      dto.lastReadMessageId,
    );
  }
}
