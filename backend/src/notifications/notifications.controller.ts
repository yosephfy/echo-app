import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

class RegisterDto {
  token: string;
}

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  /** Save the client’s Expo push token */
  @Post('register')
  register(@Request() req, @Body() dto: RegisterDto) {
    return this.svc.register(req.user.userId, dto.token);
  }
}
