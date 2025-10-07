import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({ example: 'Maria Oliveira' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: '6ºA' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  classroom?: string;
}
