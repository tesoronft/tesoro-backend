import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/exceptions';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const apiValidationPipes: ValidationPipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    errorHttpStatusCode: 400,
    transformOptions: { enableImplicitConversion: true },
  });

  app.enableCors({ origin: '*', credentials: true });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(apiValidationPipes);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
          scriptSrc: ["'self'", 'https:'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https:'],
          fontSrc: ["'self'", 'https:', 'data:'],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },

      referrerPolicy: { policy: 'no-referrer' },

      xPoweredBy: false,

      xContentTypeOptions: true,

      frameguard: { action: 'deny' },

      hsts: {
        maxAge: 31536000, 
        includeSubDomains: true,
        preload: true,
      },

      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-origin' },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(Number(configService.get('PORT')) || 5222, () => {
    console.log(`🚀 Server is listening on ${configService.get('PORT')}`);
  });
}
bootstrap();
