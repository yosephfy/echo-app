import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export type UserSort = 'handle_asc' | 'handle_desc' | 'recent';

export class SearchUsersDto {
  @IsOptional()
  @IsString()
  query?: string = '';

  @IsOptional()
  @IsIn(['handle_asc', 'handle_desc', 'recent'])
  sort?: UserSort = 'handle_asc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
