import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  Post,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateCredentialsDto } from '../auth/dto/update-credentials.dto';
import { UpdateAvatarDto } from '..//auth/dto/update-avatar.dto';
import { UsersService } from './users.service';
import { SearchUsersDto } from './dtos/search-users.dto';

type RefreshDto = {
  handle?: boolean;
  avatar?: boolean;
};

type UpdateProfileDto = {
  avatarUrl?: string;
  bio?: string;
  handle?: string;
};
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

  @Patch('me/profile')
  updateAvatar(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.userId, dto);
  }

  @Get('me/stats')
  async getStats(@Request() req) {
    return this.usersService.getStats(req.user.userId);
  }

  @Post('refresh-profile')
  refresh(@Request() req, @Body() dto: RefreshDto) {
    return this.usersService.refreshProfile(req.user.userId, dto);
  }

  @Get('search')
  async search(@Request() req: any, @Query() dto: SearchUsersDto) {
    // Optionally exclude requester from results by default:
    return this.usersService.searchUsers({
      requesterId: req.user?.id,
      query: dto.query ?? '',
      page: dto.page ?? 1,
      limit: dto.limit ?? 20,
      sort: dto.sort ?? 'handle_asc',
    });
  }
}
