import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: { email: string; password: string }, @Req() req: Request) {
    return this.authService.login(dto.email, dto.password, (req as any).tenantId);
  }

  @Post('register')
  register(@Body() dto: { email: string; password: string }, @Req() req: Request) {
    return this.authService.register(dto.email, dto.password, (req as any).tenantId);
  }
}
