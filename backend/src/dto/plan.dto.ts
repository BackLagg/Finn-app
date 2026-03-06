import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  name!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  dayOfMonth?: number;

  @IsOptional()
  @IsString()
  savingFor?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  roomId?: string;

  @IsOptional()
  @IsString()
  deadline?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  savingsPercent?: number;
}

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  dayOfMonth?: number;

  @IsOptional()
  @IsString()
  savingFor?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  deadline?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  savingsPercent?: number;

  @IsOptional()
  @IsString()
  completedAt?: string;
}
