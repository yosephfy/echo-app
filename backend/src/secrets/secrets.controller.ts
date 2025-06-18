import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SecretsService } from './secrets.service';
import { IsOptional, IsString } from 'class-validator';

export class CreateSecretDto {
  @IsString()
  text: string;

  @IsOptional()
  @IsString()
  mood?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('secrets')
export class SecretsController {
  constructor(private secrets: SecretsService) {}

  @Post()
  async create(@Request() req, @Body() dto: CreateSecretDto) {
    console.log('Incoming DTO:', dto);

    const { userId } = req.user;
    const secret = await this.secrets.createSecret(userId, dto.text, dto.mood);
    // Return minimal view
    return {
      id: secret.id,
      text: secret.text,
      mood: secret.mood,
      status: secret.status,
      createdAt: secret.createdAt,
    };
  }

  @Get('quota')
  async getQuota(@Request() req) {
    const seconds = await this.secrets.getCooldownSeconds(req.user.userId);
    return { secondsRemaining: seconds };
  }
}
