import { IsString } from 'class-validator';

export class CreatePartnerRoomDto {
  @IsString()
  name!: string;
}

export class JoinPartnerRoomDto {
  @IsString()
  inviteCode!: string;
}

export class RemoveMemberDto {
  @IsString()
  memberUserId!: string;
}

export class UpdatePartnerRoomDto {
  @IsString()
  name!: string;
}
