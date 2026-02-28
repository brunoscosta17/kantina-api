import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Req() req: Request, @Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password, req.tenantId!);
  }

  @Post('register')
  register(@Req() req: Request, @Body() dto: RegisterDto) {
    return this.auth.register(dto.email, dto.password, req.tenantId!);
  }

  @Post('refresh')
  refresh(@Req() req: Request, @Body() dto: RefreshDto) {
    return this.auth.refresh(req.tenantId!, dto.refreshToken);
  }

  @Post('logout')
  logout(@Req() req: Request, @Body() dto: RefreshDto) {
    return this.auth.logout(req.tenantId!, dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/alunos')
  async getAlunosDoResponsavel(@Req() req: Request) {
    const user = req.user as any;
    if (user.role !== 'RESPONSAVEL') {
      return [];
    }
    return this.auth.getAlunosDoResponsavel(user.id);
  }
}
