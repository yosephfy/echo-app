import { IsUUID } from 'class-validator';

export class StartChatDto {
  @IsUUID()
  peerUserId: string;
}
