import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { QueryStudentsDto } from './dto/query-students.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateStudentDto) {
    const { name, classroom } = dto;
    return this.prisma.student.create({
      data: { tenantId, name, classroom: classroom ?? null },
    });
  }

  async list(tenantId: string, q: QueryStudentsDto) {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    // ✅ tipagem explícita
    const where: Prisma.StudentWhereInput = { tenantId };
    if (q.q) where.name = { contains: q.q, mode: 'insensitive' };
    if (q.classroom) where.classroom = q.classroom;

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: pageSize,
      }),
    ]);

    return { data: rows, page, pageSize, total, hasNext: page * pageSize < total };
  }

  async get(tenantId: string, id: string) {
    const s = await this.prisma.student.findFirst({ where: { id, tenantId } });
    if (!s) throw new NotFoundException('Student not found');
    return s;
  }

  async update(tenantId: string, id: string, dto: UpdateStudentDto) {
    await this.ensureExists(tenantId, id);
    const { name, classroom } = dto;
    return this.prisma.student.update({
      where: { id },
      data: { name, classroom: classroom ?? null },
    });
  }

  async remove(tenantId: string, id: string) {
    // Se tiver wallet/pedidos, você pode optar por soft-delete.
    const wallet = await this.prisma.wallet.findFirst({ where: { tenantId, studentId: id } });
    if (wallet) {
      throw new BadRequestException('Cannot delete student with wallet. Remove wallet first.');
    }
    await this.ensureExists(tenantId, id);
    await this.prisma.student.delete({ where: { id } });
    return { ok: true };
  }

  private async ensureExists(tenantId: string, id: string) {
    const exists = await this.prisma.student.findFirst({ where: { id, tenantId } });
    if (!exists) throw new NotFoundException('Student not found');
  }
}
