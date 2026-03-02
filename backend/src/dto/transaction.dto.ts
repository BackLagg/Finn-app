import { IsNumber, IsEnum, IsString, IsOptional, IsDateString, IsIn } from 'class-validator';

const CURRENCIES = ['USD', 'EUR', 'RUB', 'BYN'] as const;

export class CreateTransactionDto {
  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsIn(CURRENCIES)
  currency?: string;

  @IsEnum(['income', 'expense'])
  type!: 'income' | 'expense';

  @IsString()
  category!: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  roomId?: string;

  @IsOptional()
  @IsString()
  receiptImageUrl?: string;
}

export class UpdateTransactionDto {
  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsIn(CURRENCIES)
  currency?: string;

  @IsOptional()
  @IsEnum(['income', 'expense'])
  type?: 'income' | 'expense';

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  receiptImageUrl?: string;
}
