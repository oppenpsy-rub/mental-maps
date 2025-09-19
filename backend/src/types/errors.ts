export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly type: string;
  public readonly details?: any;

  constructor(message: string, statusCode: number, type: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.details = details;
    this.name = 'ApiError';

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  static badRequest(message: string, details?: any): ApiError {
    return new ApiError(message, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(message, 403, 'FORBIDDEN');
  }

  static notFound(message: string = 'Resource not found'): ApiError {
    return new ApiError(message, 404, 'NOT_FOUND');
  }

  static conflict(message: string, details?: any): ApiError {
    return new ApiError(message, 409, 'CONFLICT', details);
  }

  static unprocessableEntity(message: string, details?: any): ApiError {
    return new ApiError(message, 422, 'UNPROCESSABLE_ENTITY', details);
  }

  static tooManyRequests(message: string = 'Too many requests'): ApiError {
    return new ApiError(message, 429, 'TOO_MANY_REQUESTS');
  }

  static internal(message: string = 'Internal server error', details?: any): ApiError {
    return new ApiError(message, 500, 'INTERNAL_ERROR', details);
  }

  static serviceUnavailable(message: string = 'Service unavailable'): ApiError {
    return new ApiError(message, 503, 'SERVICE_UNAVAILABLE');
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class DatabaseError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 500, 'DATABASE_ERROR', details);
    this.name = 'DatabaseError';
  }
}