import { IsISO8601, IsIn, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from './pagination.dto';

export class OrdersQueryDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsIn(['CREATED', 'PAID', 'FULFILLED', 'CANCELLED'])
  status?: 'CREATED' | 'PAID' | 'FULFILLED' | 'CANCELLED';

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}
