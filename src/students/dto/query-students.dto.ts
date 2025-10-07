import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/reports/dto/pagination.dto';

export class QueryStudentsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Busca por nome (contains, case-insensitive)' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: '6ºA' })
  @IsOptional()
  @IsString()
  classroom?: string;
}
