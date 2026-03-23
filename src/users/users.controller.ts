import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles('ADMIN', 'GESTOR')
  async list(@Req() req: any) {
    const tenantId = req.tenantId;
    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        studentId: true,
      },
    });
  }

  @Post()
  @Roles('ADMIN', 'GESTOR')
  async create(@Req() req: any, @Body() body: any) {
    const tenantId = req.tenantId;
    // Note: This is an simplified implementation for managing team
    return this.prisma.user.create({
      data: {
        ...body,
        tenantId,
      },
    });
  }

  @Patch(':id')
  @Roles('ADMIN', 'GESTOR')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const tenantId = req.tenantId;
    return this.prisma.user.update({
      where: { id, tenantId },
      data: body,
    });
  }

  @Delete(':id')
  @Roles('ADMIN', 'GESTOR')
  async remove(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantId;
    return this.prisma.user.delete({
      where: { id, tenantId },
    });
  }
}
