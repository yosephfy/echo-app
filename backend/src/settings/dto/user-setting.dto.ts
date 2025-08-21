import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SetUserSettingDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  /** Value serialized as string; service will validate/coerce */
  @IsString()
  value: string;
}

export class BulkSetUserSettingsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetUserSettingDto)
  items: SetUserSettingDto[];
}

export class ListAuditQueryDto {
  @IsOptional()
  @IsString()
  key?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
