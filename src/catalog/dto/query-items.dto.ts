import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from 'src/reports/dto/pagination.dto';

export class QueryItemsDto extends PaginationDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'true', description: 'Filtra por ativos/inativos' })
  @IsOptional()
  @IsBooleanString()
  active?: string; // 'true' | 'false'
}
