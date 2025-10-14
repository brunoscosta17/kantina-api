import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class MoneyDto {
  @IsInt()
  @Min(1)
  amountCents!: number;

  @IsOptional()
  @IsString()
  requestId?: string;
}
