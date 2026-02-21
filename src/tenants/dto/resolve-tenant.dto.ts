import { IsString, Matches } from 'class-validator';

export class ResolveTenantDto {
  @IsString()
  @Matches(/^(\d{6}|\d{8})$/, { message: 'code must be 6 or 8 digits' })
  code!: string;
}
