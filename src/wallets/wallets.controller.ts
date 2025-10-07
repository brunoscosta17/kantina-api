import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WalletsService } from './wallets.service';

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletsController {
  constructor(private readonly svc: WalletsService) {}

  @Get(':studentId')
  get(@Param('studentId') studentId: string, @Req() req: any) {
    return this.svc.get(req.tenantId, studentId);
  }
}
