import { Body, Controller, Headers, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

class RegisterDto extends LoginDto {}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Headers('x-tenant') tenantId: string, @Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password, tenantId);
  }

  @Post('register')
  register(@Headers('x-tenant') tenantId: string, @Body() dto: RegisterDto) {
    return this.auth.register(dto.email, dto.password, tenantId);
  }

  @Post('refresh')
  refresh(@Headers('x-tenant') tenantId: string, @Body() dto: RefreshDto) {
    return this.auth.refresh(tenantId, dto.refreshToken);
  }

  @Post('logout')
  logout(@Headers('x-tenant') tenantId: string, @Body() dto: RefreshDto) {
    return this.auth.logout(tenantId, dto.refreshToken);
  }
}
