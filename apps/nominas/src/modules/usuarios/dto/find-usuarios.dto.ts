import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * M2 / hardening-medium-low — pagination request DTO.
 *
 * `page` is 1-indexed (`@Min(1)`); `limit` is bounded to 100 by
 * `@Max(100)` so an admin cannot request the entire collection in a
 * single call (memory DoS defense). Defaults applied via the
 * controller's `@Query()` transform.
 */
export class FindUsuariosDto {
  @ApiProperty({
    example: 1,
    description: '1-indexed page number',
    required: false,
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @ApiProperty({
    example: 20,
    description: 'Items per page (max 100)',
    required: false,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit: number = 20;
}
