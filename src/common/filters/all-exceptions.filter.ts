import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;

    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody = isHttp ? exception.getResponse() : null;

    const message =
      typeof responseBody === 'string'
        ? responseBody
        : ((responseBody as any)?.message ??
          (exception as any)?.message ??
          'Internal server error');

    const error =
      typeof responseBody === 'object'
        ? ((responseBody as any)?.error ?? (exception as any)?.name)
        : ((exception as any)?.name ?? 'Error');

    if (!isHttp) {
      console.error('Unhandled exception:', exception);
    }

    res.status(status).json({
      statusCode: status,
      path: req.url,
      message,
      error,
      requestId: (req as any).id,
    });
  }
}
