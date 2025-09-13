import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core/constants';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { RolesGuard } from './auth/roles.guard';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { CapsModule } from './caps/caps.module';
import { ModerationModule } from './moderation/moderation.module';
import { ReactionsModule } from './reactions/reactions.module';
import { RedisModule } from './redis/redis.module';
import { ReportsModule } from './reports/reports.module';
import { SecretsModule } from './secrets/secrets.module';
import { StreaksModule } from './streaks/streaks.module';
import { UsersModule } from './users/users.module';
import { RepliesModule } from './replies/replies.module';
import { ReplyReactionsModule } from './reply-reactions/reply-reactions.module';
import { SettingsModule } from './settings/settings.module';
import { FirebaseModule } from './firebase/firebase.module';
import { ChatModule } from './chat/chat.module';
import { MoodsModule } from './moods/moods.module';
import { TagsModule } from './tags/tags.module';

@Module({
  providers: [
    { provide: APP_GUARD, useClass: RolesGuard },
    // ...
  ],
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        autoLoadEntities: true,
        synchronize: true, // disable in prod
      }),
    }),
    UsersModule,
    AuthModule,
    RedisModule,
    SecretsModule,
    ReportsModule,
    ModerationModule,
    StreaksModule,
    ReactionsModule,
    CapsModule,
    BookmarksModule,
    RepliesModule,
    ReplyReactionsModule,
    SettingsModule,
    FirebaseModule,
    ChatModule,
    MoodsModule,
    TagsModule,

    // ... your feature modules (Users, Auth) go here
  ],
})
export class AppModule {}
