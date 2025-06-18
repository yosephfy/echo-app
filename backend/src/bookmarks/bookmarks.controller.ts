import {
  UseGuards,
  Controller,
  Post,
  Param,
  Get,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { BookmarksService } from './bookmarks.service';

@UseGuards(JwtAuthGuard)
@Controller('bookmarks')
export class BookmarksController {
  constructor(private svc: BookmarksService) {}

  @Post(':secretId')
  async add(@Request() req, @Param('secretId') secretId: string) {
    return this.svc.toggle(req.user.userId, secretId);
  }

  @Get()
  async list(@Request() req) {
    return this.svc.list(req.user.userId);
  }
}
