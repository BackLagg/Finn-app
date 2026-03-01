import { IsString } from 'class-validator';

export class CreatePartnerRoomDto {
  @IsString()
  name!: string;
}

export class JoinPartnerRoomDto {
  @IsString()
  inviteCode!: string;
}
