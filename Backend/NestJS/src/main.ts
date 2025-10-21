import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { setupMetrics } from './metrics.js';
import { setupTracing } from './tracing.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });
  app.enableCors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] });

  setupTracing();
  setupMetrics(app);

  const config = new DocumentBuilder()
    .setTitle('CMM Core API')
    .setDescription('Endpoints principais de negócio (NestJS)')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = +(process.env.PORT || 3000);
  await app.listen(port);
  console.log(`Core API is running on port ${port}`);
}

bootstrap();