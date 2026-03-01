import { IsNumber, IsEnum, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateTransactionDto {
  @IsNumber()
  amount!: number;

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
}

export class UpdateTransactionDto {
  @IsOptional()
  @IsNumber()
  amount?: number;

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
}
