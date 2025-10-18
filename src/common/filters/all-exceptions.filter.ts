import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload =
      exception instanceof HttpException
        ? (exception.getResponse() as unknown)
        : { message: 'Internal server error' };

    response.status(status).json({
      statusCode: status,
      path: request.url,
      ...(typeof payload === 'object' && payload ? payload : { message: String(payload) }),
    });
  }
}
