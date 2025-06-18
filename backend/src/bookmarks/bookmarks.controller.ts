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
  secretsRepo: any;
  constructor(private svc: BookmarksService) {}

  @Post(':secretId')
  async add(@Request() req, @Param('secretId') secretId: string) {
    return this.svc.toggle(req.user.userId, secretId);
  }

  @Get()
  async list(@Request() req) {
    // returns Bookmark entities; map to { id, text, mood, status, createdAt }
    const bms = await this.svc.list(req.user.userId);
    return Promise.all(
      bms.map(async (bm) => {
        const secret = await this.secretsRepo.findOne({
          where: { id: bm.secretId },
        });
        return {
          /* pick fields from secret */
        };
      }),
    );
  }
}
