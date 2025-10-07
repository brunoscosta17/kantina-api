import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS: liberar front (ajustaremos origem depois)
  app.enableCors({ origin: '*', credentials: true });

  // Validação: remove campos não declarados nos DTOs (whitelist)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
