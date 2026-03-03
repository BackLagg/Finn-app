import { IsNumber, IsString, IsOptional, IsBoolean, IsDateString, IsIn } from 'class-validator';

const CURRENCIES = ['USD', 'EUR', 'RUB', 'BYN'] as const;

export class CreateReminderDto {
  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsIn(CURRENCIES)
  currency?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  date!: string;

  @IsNumber()
  dayOfMonth!: number;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsString()
  roomId?: string;
}
