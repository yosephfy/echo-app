import { Module } from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { BookmarksController } from './bookmarks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bookmark } from 'src/bookmarks/bookmark.entity';

@Module({
  imports: [
    // ← Register the Reaction entity so Nest can inject its Repository
    TypeOrmModule.forFeature([Bookmark]),
  ],
  providers: [BookmarksService],
  controllers: [BookmarksController],
})
export class BookmarksModule {}
