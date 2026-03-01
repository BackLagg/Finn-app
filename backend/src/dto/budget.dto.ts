import {
  IsNumber,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FixedExpenseDto {
  @IsString()
  name!: string;

  @IsNumber()
  @Min(0)
  amount!: number;
}

export class CreateBudgetSettingsDto {
  @IsString()
  currency!: string;

  @IsNumber()
  @Min(0)
  monthlyIncome!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FixedExpenseDto)
  fixedExpenses!: FixedExpenseDto[];

  @IsNumber()
  @Min(0)
  @Max(100)
  savingsPercent!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  investmentsPercent!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  purchasesPercent!: number;

  @IsOptional()
  @IsString()
  roomId?: string;
}
