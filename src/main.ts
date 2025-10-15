import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  function parseOrigins(env?: string) {
    if (!env) return [/localhost:\d+$/];
    return env
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const origins = parseOrigins(process.env.FRONTEND_ORIGINS);
  app.enableCors({
    origin: origins,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  // Validação: remove campos não declarados nos DTOs (whitelist)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Kantina API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'x-tenant',
        description: 'Tenant ID (apenas no /auth/login)',
      },
      'tenant',
    )
    .addSecurityRequirements('tenant')
    .addSecurityRequirements('bearer')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.useGlobalFilters(new AllExceptionsFilter());

  app.use(helmet());

  // Request ID sem `any` e sem `uuid` externo
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.id = (req.headers['x-request-id'] as string) ?? randomUUID();
    next();
  });

  await app.listen(Number(process.env.PORT) || 8080, '0.0.0.0');
}
void bootstrap();
