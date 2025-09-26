import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = process.env.PORT || process.env.BACKEND_PORT || 3000;
  const host = process.env.BACKEND_HOST || '0.0.0.0';
  await app.listen(port, host);
}
bootstrap();
