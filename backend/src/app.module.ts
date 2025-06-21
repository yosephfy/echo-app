import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PreferencesModule } from './preferences/preferences.module';
import { RedisModule } from './redis/redis.module';
import { SecretsModule } from './secrets/secrets.module';
import { APP_GUARD } from '@nestjs/core/constants';
import { RolesGuard } from './auth/roles.guard';
import { ReportsModule } from './reports/reports.module';
import { ModerationModule } from './moderation/moderation.module';
import { ScheduleModule } from '@nestjs/schedule';
import { StreaksModule } from './streaks/streaks.module';

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
    // ... your feature modules (Users, Auth) go here
  ],
})
export class AppModule {}
