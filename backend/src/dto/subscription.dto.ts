import { IsString, IsIn, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ActivateSubscriptionDto {
  @IsString()
  @IsIn(['finn', 'finn_plus'])
  tier!: 'finn' | 'finn_plus';
}

export class GrantSubscriptionDto {
  @IsString()
  userId!: string;

  @IsString()
  @IsIn(['finn', 'finn_plus'])
  tier!: 'finn' | 'finn_plus';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(365)
  days?: number;
}

export class RevokeSubscriptionDto {
  @IsString()
  userId!: string;
}
