import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';
import { UserMetrics } from './user-metrics.entity';
import { Bookmark } from 'src/bookmarks/bookmark.entity';
import { Secret } from 'src/secrets/secret.entity';
import { Streak } from 'src/streaks/streak.entity';
import { HandleService } from './handle.service';
import { Cap } from 'src/caps/cap.entity';
import { Reaction } from 'src/reactions/reaction.entity';
import { Reply } from 'src/replies/reply.entity';

@Module({
  imports: [
    // e.g. in UsersModule
    TypeOrmModule.forFeature([
      User,
      UserMetrics,
      Secret,
      Bookmark,
      Streak,
      Reaction,
      Cap,
      Reply,
    ]),
  ],
  providers: [UsersService, HandleService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
