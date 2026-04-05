import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  Max,
} from 'class-validator';

export class UpdateNotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  dailyReminder?: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'dailyReminderTime must be HH:mm' })
  dailyReminderTime?: string;

  @IsOptional()
  @IsBoolean()
  budgetAlerts?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  budgetAlertThreshold?: number;

  @IsOptional()
  @IsBoolean()
  weeklyReport?: boolean;

  @IsOptional()
  @IsBoolean()
  goalProgress?: boolean;
}
