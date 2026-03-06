import { IsBoolean, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class DistributionDto {
  @IsNumber()
  savings!: number;
  @IsNumber()
  investments!: number;
  @IsNumber()
  purchases!: number;
}

export class CompleteOnboardingDto {
  @IsOptional()
  @IsString()
  initData?: string;

  @IsOptional()
  @IsString()
  tgWebAppStartParam?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

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
