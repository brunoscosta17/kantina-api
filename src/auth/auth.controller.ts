import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiBody, ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@ApiSecurity('tenant')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiBody({ type: LoginDto })
  async login(@Req() req: Request, @Body() dto: LoginDto) {
    const tenantId = req.tenantId as string;
    return this.authService.login(dto.email, dto.password, tenantId);
  }

  @Post('register')
  @ApiBody({ type: RegisterDto })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const tenantId = req.tenantId as string;
    return this.authService.register(dto.email, dto.password, tenantId);
  }
}
