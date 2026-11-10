import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { generalRateLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';
import { ApiError } from './utils/ApiError.js';
import { successResponse } from './utils/response.js';
import apiRouter from './routes/index.js';

export const createApp = () => {
  const app = express();

  // Trust proxy if running behind reverse proxy
  app.set('trust proxy', 1);

  // Security headers
  app.use(helmet());

  // CORS configuration
  const corsOrigins = env.CORS_ORIGINS;
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin) return callback(null, true);
        if (corsOrigins.includes('*') || corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Origin not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Response compression
  app.use(compression());

  // Parse JSON bodies (1MB limit)
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  // Request logger (disabled during automated tests to avoid noisy output)
  if (env.NODE_ENV !== 'test') {
    app.use(
      pinoHttp({
        logger,
        autoLogging: {
          ignore: (req) => req.url === '/health' || req.url === '/api/v1/health',
        },
      })
    );
  }

  // Health check endpoint (both /health and /api/v1/health)
  const healthHandler = (_req, res) => {
    return successResponse(res, {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  };
  app.get('/health', healthHandler);

  // Apply general rate limiter to API routes
  app.use('/api/v1', generalRateLimiter);

  // Mount API v1 router
  app.use('/api/v1', apiRouter);

  // 404 handler for undefined routes
  app.use((req, _res, next) => {
    next(ApiError.notFound(`Cannot ${req.method} ${req.path}`));
  });

  // Centralized error handling middleware
  app.use(errorHandler);

  return app;
};
