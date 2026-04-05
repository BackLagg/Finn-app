import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  IsMongoId,
} from 'class-validator';

export class CreateBudgetLimitDto {
  @IsString()
  category!: string;

  @IsNumber()
  @Min(0)
  limit!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsEnum(['daily', 'weekly', 'monthly'] as const)
  period!: 'daily' | 'weekly' | 'monthly';

  @IsOptional()
  @IsMongoId()
  roomId?: string;
}

export class UpdateBudgetLimitDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  limit?: number;

  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly'] as const)
  period?: 'daily' | 'weekly' | 'monthly';
}
