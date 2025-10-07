import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class TopupDto {
  @IsInt()
  @Min(100)
  @Max(100_000)
  amountCents!: number;

  @IsOptional()
  @IsString()
  note?: string;
}
