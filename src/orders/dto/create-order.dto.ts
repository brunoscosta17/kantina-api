import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateOrderItemDto {
  @IsUUID()
  itemId!: string;

  @IsInt()
  @Min(1)
  qty!: number;
}

export class CreateOrderDto {
  @IsUUID()
  studentId!: string;

  @IsArray()
  @ArrayMinSize(1)
  items!: CreateOrderItemDto[];
}

export class ListOrdersQueryDto {
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsString()
  status?: 'CREATED' | 'PAID' | 'FULFILLED' | 'CANCELLED';
}
