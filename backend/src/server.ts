import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { securityHeaders } from './middleware/securityHeaders';
import { apiRoutes } from './routes/index';
import { initializeDatabase } from './database/connection';

export async function createServer(): Promise<Application> {
  // Initialize database connection
  await initializeDatabase();
  
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configuration
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? (process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3002'])
      : ['http://localhost:3002', 'http://localhost:3000'], // Allow frontend origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
  }));

  // Rate limiting (disabled in development)
  if (process.env.NODE_ENV === 'production') {
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs in production
      message: {
        error: 'Too many requests from this IP, please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    app.use('/api', limiter);
  }

  // General middleware
  app.use(compression());
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(express.json({ 
    limit: '10mb',
    verify: (_req: Request, _res: Response, buf: Buffer) => {
      // Store raw body for webhook verification if needed
      (_req as any).rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Custom security headers
  app.use(securityHeaders);

  // Health check endpoint (before rate limiting)
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // API routes
  app.use('/api', apiRoutes);

  // Root endpoint
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      message: 'Mental Maps API',
      version: process.env.npm_package_version || '1.0.0',
      status: 'running',
      documentation: '/api/docs',
    });
  });

  // Error handling middleware (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

// Export app for testing
export const app = createServer();