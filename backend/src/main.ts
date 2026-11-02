import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global exception filter for secure error handling in production
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global validation pipe with payload stripping and transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );

  // Configure CORS
  const configuredFrontendUrl = process.env.FRONTEND_URL || '';
  const configuredOrigins = configuredFrontendUrl
    .split(',')
    .map((url) => url.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ];

  const allowedOrigins = Array.from(
    new Set([...configuredOrigins, ...defaultOrigins]),
  );

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (e.g. mobile apps, curl, uptime monitors, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      // Check exact match in configured allowed origins
      const normalizedOrigin = origin.replace(/\/+$/, '');
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      // Check if domain is a Vercel preview or production deployment
      try {
        const parsedUrl = new URL(origin);
        if (
          parsedUrl.hostname.endsWith('.vercel.app') ||
          parsedUrl.hostname.endsWith('.onrender.com') ||
          parsedUrl.hostname === 'localhost' ||
          parsedUrl.hostname === '127.0.0.1'
        ) {
          return callback(null, true);
        }
      } catch {
        // invalid URL
      }

      if (process.env.NODE_ENV === 'production') {
        logger.warn(`Blocked CORS request from unauthorized origin: ${origin}`);
        return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
      }

      // Allow fallback in development
      return callback(null, true);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type,Accept,Authorization,X-Requested-With',
  });

  // Safe body payload limit (10MB)
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // Port and host binding for container/cloud environments (Render, Railway, Fly.io, etc.)
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  const host = '0.0.0.0';

  await app.listen(port, host);
  logger.log(`OmniMart Backend API listening on http://${host}:${port}`);
}
void bootstrap();
