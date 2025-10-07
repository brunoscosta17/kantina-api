import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsIn, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from './pagination.dto';

export class OrdersQueryDto extends PaginationDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ enum: ['CREATED', 'PAID', 'FULFILLED', 'CANCELLED'] })
  @IsOptional()
  @IsIn(['CREATED', 'PAID', 'FULFILLED', 'CANCELLED'])
  status?: 'CREATED' | 'PAID' | 'FULFILLED' | 'CANCELLED';

  @ApiPropertyOptional({ example: '2025-10-01' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ example: '2025-10-07' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
