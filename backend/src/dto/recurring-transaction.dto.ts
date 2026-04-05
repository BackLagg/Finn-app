import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsMongoId,
  Min,
} from 'class-validator';

export class CreateRecurringTransactionDto {
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsEnum(['income', 'expense'] as const)
  type!: 'income' | 'expense';

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(['daily', 'weekly', 'monthly', 'yearly'] as const)
  frequency!: 'daily' | 'weekly' | 'monthly' | 'yearly';

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsMongoId()
  roomId?: string;

  @IsOptional()
  @IsString()
  currency?: string;
}

export class UpdateRecurringTransactionDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly', 'yearly'] as const)
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
