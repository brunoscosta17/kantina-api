import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@ApiSecurity('tenant')
@Controller('auth')
export class AuthController {
  constructor(private readonly svc: AuthService) {}

  @Post('login')
  @ApiHeader({ name: 'x-tenant', required: true, description: 'Tenant ID' })
  @ApiBody({ type: LoginDto })
  async login(@Body() dto: LoginDto, @Req() req: any) {
    return this.svc.login(dto.email, dto.password, req.tenantId);
  }

  @Post('register')
  @ApiHeader({ name: 'x-tenant', required: true, description: 'Tenant ID' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() dto: RegisterDto, @Req() req: any) {
    return this.svc.register(dto.email, dto.password, req.tenantId);
  }
}
