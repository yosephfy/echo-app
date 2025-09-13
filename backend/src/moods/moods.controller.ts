import { Controller, Get, Param, Query } from '@nestjs/common';
import { MoodsService } from './moods.service';

@Controller('moods')
export class MoodsController {
  constructor(private readonly moods: MoodsService) {}

  @Get()
  list(@Query('all') all?: string) {
    const activeOnly = !(all === '1' || all === 'true');
    return this.moods.list(activeOnly);
  }

  @Get(':code')
  get(@Param('code') code: string) {
    return this.moods.getByCode(code);
  }
}
