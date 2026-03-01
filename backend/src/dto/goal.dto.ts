import { IsNumber, IsString, IsOptional, IsDateString, Min } from 'class-validator';

export class CreateGoalDto {
  @IsString()
  title!: string;

  @IsNumber()
  @Min(0)
  targetAmount!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsString()
  roomId?: string;
}

export class UpdateGoalDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  targetAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentAmount?: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;
}
