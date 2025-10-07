import { IsIn, IsISO8601, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from './pagination.dto';

export class TransactionsQueryDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsIn(['TOPUP', 'DEBIT', 'REFUND'])
  type?: 'TOPUP' | 'DEBIT' | 'REFUND';

  @IsOptional()
  @IsISO8601()
  from?: string; // ISO date

  @IsOptional()
  @IsISO8601()
  to?: string; // ISO date
}
