import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import helmet from 'helmet';
import type { IncomingMessage, ServerResponse } from 'http';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

const server = express();
let isReady = false;

function parseOrigins(env?: string) {
  if (!env) return [/localhost:\d+$/];
  return env
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: ['error', 'warn', 'log'],
  });

  app.enableCors({
    origin: parseOrigins(process.env.FRONTEND_ORIGINS),
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.use(helmet());

  // Tipos explícitos aqui
  app.use((req: Request, _res: Response, next: NextFunction) => {
    (req as Request & { id?: string }).id =
      (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
    next();
  });

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

  await app.init();
  isReady = true;
}

// Use os tipos do runtime do Vercel e converta para http nativo para o Express
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isReady) await bootstrap();
  server(req as unknown as IncomingMessage, res as unknown as ServerResponse);
}
