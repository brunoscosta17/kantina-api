import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from './pagination.dto';

export class TransactionsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ enum: ['TOPUP', 'DEBIT', 'REFUND'] })
  @IsOptional()
  @IsIn(['TOPUP', 'DEBIT', 'REFUND'])
  type?: 'TOPUP' | 'DEBIT' | 'REFUND';

  @ApiPropertyOptional({ example: '2025-10-01' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ example: '2025-10-07' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
