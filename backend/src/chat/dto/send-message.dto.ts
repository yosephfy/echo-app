import { IsOptional, IsString, IsUrl, IsIn } from 'class-validator';

export class SendMessageDto {
  @IsString()
  body: string;

  @IsOptional()
  @IsUrl()
  attachmentUrl?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  // Idempotency
  @IsString()
  clientToken: string;
}
