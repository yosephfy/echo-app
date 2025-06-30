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
import { PreferencesModule } from './preferences/preferences.module';
import { ReactionsModule } from './reactions/reactions.module';
import { RedisModule } from './redis/redis.module';
import { ReportsModule } from './reports/reports.module';
import { SecretsModule } from './secrets/secrets.module';
import { StreaksModule } from './streaks/streaks.module';
import { UsersModule } from './users/users.module';

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
    PreferencesModule,
    RedisModule,
    SecretsModule,
    ReportsModule,
    ModerationModule,
    StreaksModule,
    ReactionsModule,
    CapsModule,
    BookmarksModule,
    // ... your feature modules (Users, Auth) go here
  ],
})
export class AppModule {}
