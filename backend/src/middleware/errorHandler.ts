import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types/errors';

export interface ErrorResponse {
  type: string;
  message: string;
  details?: any;
  timestamp: string;
  path: string;
}

export function errorHandler(
  error: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const timestamp = new Date().toISOString();
  const path = req.originalUrl;

  // Log error for debugging
  console.error(`[${timestamp}] Error on ${req.method} ${path}:`, error);

  // Handle known API errors
  if (error instanceof ApiError) {
    const response: ErrorResponse = {
      type: error.type,
      message: error.message,
      timestamp,
      path,
    };

    if (error.details) {
      response.details = error.details;
    }

    res.status(error.statusCode).json(response);
    return;
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    res.status(400).json({
      type: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: error.message,
      timestamp,
      path,
    });
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      type: 'AUTHENTICATION_ERROR',
      message: 'Invalid token',
      timestamp,
      path,
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      type: 'AUTHENTICATION_ERROR',
      message: 'Token expired',
      timestamp,
      path,
    });
    return;
  }

  // Handle database errors
  if (error.name === 'QueryFailedError') {
    res.status(500).json({
      type: 'DATABASE_ERROR',
      message: 'Database operation failed',
      timestamp,
      path,
      ...(process.env.NODE_ENV === 'development' && { details: error.message }),
    });
    return;
  }

  // Handle CORS errors
  if (error.message.includes('CORS')) {
    res.status(403).json({
      type: 'CORS_ERROR',
      message: 'CORS policy violation',
      timestamp,
      path,
    });
    return;
  }

  // Default error response
  res.status(500).json({
    type: 'INTERNAL_ERROR',
    message: 'Internal server error',
    timestamp,
    path,
    ...(process.env.NODE_ENV === 'development' && { details: error.message, stack: error.stack }),
  });
}