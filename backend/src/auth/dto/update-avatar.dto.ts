import { IsUrl } from 'class-validator';

export class UpdateAvatarDto {
  @IsUrl()
  avatarUrl: string;
  random?: boolean;
}
