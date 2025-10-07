import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateStudentDto } from './dto/create-student.dto';
import { QueryStudentsDto } from './dto/query-students.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentsService } from './students.service';

@ApiTags('Students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly svc: StudentsService) {}

  @Post()
  @Roles('ADMIN', 'GESTOR', 'OPERADOR')
  create(@Req() req: Express.Request, @Body() dto: CreateStudentDto) {
    return this.svc.create(req.tenantId!, dto);
  }

  @Get()
  @Roles('ADMIN', 'GESTOR', 'OPERADOR')
  list(@Req() req: Express.Request, @Query() q: QueryStudentsDto) {
    return this.svc.list(req.tenantId!, q);
  }

  @Get(':id')
  @Roles('ADMIN', 'GESTOR', 'OPERADOR')
  get(@Req() req: Express.Request, @Param('id') id: string) {
    return this.svc.get(req.tenantId!, id);
  }

  @Put(':id')
  @Roles('ADMIN', 'GESTOR', 'OPERADOR')
  update(@Req() req: Express.Request, @Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.svc.update(req.tenantId!, id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'GESTOR')
  remove(@Req() req: Express.Request, @Param('id') id: string) {
    return this.svc.remove(req.tenantId!, id);
  }
}
