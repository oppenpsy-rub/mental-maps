import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import { ValidationError } from '../types/errors';

export interface ValidationOptions {
  abortEarly?: boolean;
  stripUnknown?: boolean;
}

/**
 * Middleware factory for validating request body using Joi schemas
 */
export function validateRequest(
  schema: Schema, 
  options: ValidationOptions = { abortEarly: false, stripUnknown: true }
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, options);

    if (error) {
      const validationErrors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      const validationError = new ValidationError(
        'Request validation failed',
        validationErrors
      );

      return next(validationError);
    }

    // Replace request body with validated and sanitized data
    req.body = value;
    next();
  };
}

/**
 * Middleware factory for validating request parameters using Joi schemas
 */
export function validateParams(
  schema: Schema,
  options: ValidationOptions = { abortEarly: false, stripUnknown: true }
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params, options);

    if (error) {
      const validationErrors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      const validationError = new ValidationError(
        'Parameter validation failed',
        validationErrors
      );

      return next(validationError);
    }

    // Replace request params with validated data
    req.params = value;
    next();
  };
}

/**
 * Middleware factory for validating query parameters using Joi schemas
 */
export function validateQuery(
  schema: Schema,
  options: ValidationOptions = { abortEarly: false, stripUnknown: true }
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, options);

    if (error) {
      const validationErrors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      const validationError = new ValidationError(
        'Query validation failed',
        validationErrors
      );

      return next(validationError);
    }

    // Replace request query with validated data
    req.query = value;
    next();
  };
}