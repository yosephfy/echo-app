import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
} from 'class-validator';

export class UpsertDefinitionDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  section: string;

  @IsIn(['boolean', 'string', 'integer', 'json', 'enum'])
  type: 'boolean' | 'string' | 'integer' | 'json' | 'enum';

  @IsOptional()
  @IsString()
  defaultValue?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isDeprecated?: boolean;
}

export class UpdateDefinitionDto {
  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsIn(['boolean', 'string', 'integer', 'json', 'enum'])
  type?: 'boolean' | 'string' | 'integer' | 'json' | 'enum';

  @IsOptional()
  @IsString()
  defaultValue?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isDeprecated?: boolean;
}
