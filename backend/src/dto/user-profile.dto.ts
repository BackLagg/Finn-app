import { IsBoolean, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class DistributionDto {
  @IsNumber()
  savings!: number;
  @IsNumber()
  investments!: number;
  @IsNumber()
  purchases!: number;
}

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  initData?: string;

  @IsOptional()
  @IsString()
  tgWebAppStartParam?: string;

  @IsOptional()
  @IsString()
  user?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyIncome?: number;

  @IsOptional()
  @IsBoolean()
  savingsOnly?: boolean;

  @IsOptional()
  @IsObject()
  distribution?: DistributionDto;
}

export class UserProfileResponseDto {
  id!: string;
  userId!: string;
  name!: string;
  isNew!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
