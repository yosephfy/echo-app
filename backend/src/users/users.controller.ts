import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateCredentialsDto } from '../auth/dto/update-credentials.dto';
import { UpdateAvatarDto } from '..//auth/dto/update-avatar.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getProfile(@Request() req) {
    // req.user comes from JwtStrategy.validate()
    return this.usersService.findByEmail(req.user.email);
  }

  @Patch('me/credentials')
  updateCredentials(@Request() req, @Body() dto: UpdateCredentialsDto) {
    return this.usersService.updateCredentials(req.user.userId, dto);
  }

  @Patch('me/avatar')
  updateAvatar(@Request() req, @Body() dto: UpdateAvatarDto) {
    return this.usersService.updateAvatar(req.user.userId, dto);
  }

  @Get('me/stats')
  async getStats(@Request() req) {
    return this.usersService.getStats(req.user.userId);
  }
}
