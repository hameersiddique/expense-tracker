import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import compression = require('compression');
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const configService = app.get(ConfigService);

  app.use(helmet());
  app.use(compression());

  app.enableCors({
    origin: configService.get<string>('corsOrigin'),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const apiPrefix = configService.get<string>('apiPrefix') || 'api/v1';
  app.setGlobalPrefix(apiPrefix, { exclude: ['/'] });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Expense Tracker API')
    .setDescription('Production-ready expense tracker backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  const port = configService.get<number>('port') || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application running on: http://localhost:${port}/${apiPrefix}`);
  console.log(`Swagger docs available at: http://localhost:${port}/${apiPrefix}/docs`);
}
bootstrap();
