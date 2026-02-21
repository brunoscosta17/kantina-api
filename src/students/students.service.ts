import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './../prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { QueryStudentsDto } from './dto/query-students.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateStudentDto) {
    try {
      return await this.prisma.student.create({
        data: {
          tenantId,
          name: dto.name.trim(),
          classroom: dto.classroom?.trim() || null,
        },
      });
    } catch (e: any) {
      // unique: tenantId_name_classroom
      if (e?.code === 'P2002') {
        throw new ConflictException('Student already exists for this tenant/classroom');
      }
      throw e;
    }
  }

  async list(tenantId: string, q: QueryStudentsDto) {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: any = { tenantId };
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

  async getById(tenantId: string, id: string) {
    const student = await this.prisma.student.findFirst({
      where: { tenantId, id },
      select: {
        id: true,
        name: true,
        classroom: true,
      },
    });

    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async update(tenantId: string, id: string, dto: UpdateStudentDto) {
    // garante que pertence ao tenant
    await this.getById(tenantId, id);

    try {
      return await this.prisma.student.update({
        where: { id },
        data: {
          name: dto.name?.trim(),
          classroom: dto.classroom === undefined ? undefined : dto.classroom?.trim() || null,
        },
        select: { id: true, name: true, classroom: true },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException('Student already exists for this tenant/classroom');
      }
      throw e;
    }
  }

  async remove(tenantId: string, id: string) {
    // garante tenant
    await this.getById(tenantId, id);

    // se existir wallet, você pode escolher:
    // - bloquear delete, ou
    // - deletar wallet primeiro
    // Vou deletar wallet antes para evitar erro de FK.
    await this.prisma.wallet.deleteMany({ where: { tenantId, studentId: id } });

    await this.prisma.student.delete({ where: { id } });
    return { ok: true };
  }

  async getWallet(tenantId: string, studentId: string) {
    // garante tenant
    await this.getById(tenantId, studentId);

    const wallet = await this.prisma.wallet.findFirst({
      where: { tenantId, studentId },
      select: {
        id: true,
        studentId: true,
        balanceCents: true,
      },
    });

    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }
}
