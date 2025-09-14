import { Controller, Get, Param, Query } from '@nestjs/common';
import { TagsService } from './tags.service';

@Controller('tags')
export class TagsController {
  constructor(private readonly tags: TagsService) {}

  @Get()
  list(@Query('limit') limit?: string) {
    const lim = Math.min(Math.max(parseInt(limit ?? '50', 10) || 50, 1), 200);
    return this.tags.list(lim);
  }

  @Get('trending')
  trending(@Query('limit') limit?: string, @Query('hours') hours?: string) {
    const lim = Math.min(Math.max(parseInt(limit ?? '20', 10) || 20, 1), 100);
    const hrs = Math.min(Math.max(parseInt(hours ?? '24', 10) || 24, 1), 168); // Max 1 week
    return this.tags.getTrending(lim, hrs);
  }

  @Get('search')
  search(@Query('q') q?: string, @Query('limit') limit?: string) {
    const lim = Math.min(Math.max(parseInt(limit ?? '20', 10) || 20, 1), 200);
    return this.tags.search(q ?? '', lim);
  }

  @Get(':slug')
  get(@Param('slug') slug: string) {
    return this.tags.get(slug);
  }
}
