import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Request, Response } from 'express';
import express from 'express';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import { AllExceptionsFilter } from 'src/common/filters/all-exceptions.filter';
import { AppModule } from 'src/app.module';

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

  // Configurar global prefix para evitar conflitos de roteamento
  // app.setGlobalPrefix('api'); // Comentado pois já é tratado no Vercel

  app.enableCors({
    origin: parseOrigins(process.env.FRONTEND_ORIGINS),
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.use(helmet());

  app.use((req, _res, next) => {
    // adiciona um request-id
    req.id = req.headers['x-request-id'] ?? randomUUID();
    next();
  });

  const cfg = new DocumentBuilder()
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

  const doc = SwaggerModule.createDocument(app, cfg);
  SwaggerModule.setup('docs', app, doc);

  await app.init();
  isReady = true;
}

// exporta o handler padrão para o Vercel (usa o servidor Express já criado)
export default async function handler(req: Request, res: Response) {
  if (!isReady) await bootstrap();
  return server(req, res);
}
