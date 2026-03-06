import { IsString, IsIn } from 'class-validator';

export class ActivateSubscriptionDto {
  @IsString()
  @IsIn(['finn', 'finn_plus'])
  tier!: 'finn' | 'finn_plus';
}
