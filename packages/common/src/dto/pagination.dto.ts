import { IsOptional, Min, Max, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Standard pagination query parameters.
 * Use in controller methods that return paginated lists.
 *
 * @example
 * ```typescript
 * @Get()
 * async findAll(@Query() pagination: PaginationDto) {
 *   return this.service.findAll(pagination);
 * }
 * ```
 */
export class PaginationDto {
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
  limit?: number = 10;
}

/** Metadata returned alongside paginated results. */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Wrapper for paginated endpoint responses. */
export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

/** Build a {@link PaginatedResult} from raw items and pagination params. */
export function paginate<T>(
  items: T[],
  total: number,
  pagination: PaginationDto,
): PaginatedResult<T> {
  return {
    items,
    meta: {
      total,
      page: pagination.page ?? 1,
      limit: pagination.limit ?? 10,
      totalPages: Math.ceil(total / (pagination.limit ?? 10)),
    },
  };
}
