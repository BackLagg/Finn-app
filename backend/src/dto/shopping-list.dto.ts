import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ShoppingListItemDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsBoolean()
  checked?: boolean;

  @IsOptional()
  @IsNumber()
  estimatedPrice?: number;
}

export class CreateShoppingListDto {
  @IsString()
  title!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShoppingListItemDto)
  items!: ShoppingListItemDto[];

  @IsOptional()
  @IsString()
  roomId?: string;
}

export class UpdateShoppingListDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShoppingListItemDto)
  items?: ShoppingListItemDto[];

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsNumber()
  order?: number;
}
