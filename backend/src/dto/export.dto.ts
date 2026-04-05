import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsMongoId,
  IsDateString,
} from 'class-validator';

export class GenerateExportDto {
  @IsEnum(['csv', 'pdf', 'json'] as const)
  format!: 'csv' | 'pdf' | 'json';

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsBoolean()
  includeCategories?: boolean;

  @IsOptional()
  @IsBoolean()
  includeReceipts?: boolean;

  @IsOptional()
  @IsMongoId()
  roomId?: string;
}
