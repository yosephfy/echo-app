import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';
import { Bookmark } from 'src/bookmarks/bookmark.entity';
import { Secret } from 'src/secrets/secret.entity';
import { Streak } from 'src/streaks/streak.entity';
import { HandleService } from './handle.service';

@Module({
  imports: [
    // e.g. in UsersModule
    TypeOrmModule.forFeature([User, Secret, Bookmark, Streak]),
  ],
  providers: [UsersService, HandleService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
