import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    // Defaults
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Internal server error';
    let details: any = undefined;

    // HttpException (Nest)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse() as any;
      code = resp?.code ?? (exception.name || 'HTTP_ERROR');
      message = typeof resp === 'string' ? resp : (resp?.message ?? message);
      details = resp?.details;
    }

    // Prisma (erros comuns)
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      status = HttpStatus.BAD_REQUEST;
      code = exception.code;
      message = this.prismaMessage(exception);
      details = exception.meta;
    }

    // Fallback: Error genérica
    if (exception instanceof Error && !(exception instanceof HttpException)) {
      message = exception.message || message;
    }

    res.status(status).json({ code, message, details });
  }

  private prismaMessage(e: Prisma.PrismaClientKnownRequestError) {
    switch (e.code) {
      case 'P2002':
        return 'Violação de unicidade (duplicado).';
      case 'P2003':
        return 'Violação de chave estrangeira.';
      case 'P2025':
        return 'Registro não encontrado.';
      default:
        return 'Erro de banco de dados.';
    }
  }
}
