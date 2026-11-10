import { ApiError } from '../utils/ApiError.js';
import { errorResponse } from '../utils/response.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

/**
 * Global error-handling middleware.
 * Ensures every error returned to clients adheres to the API Contract envelope:
 * { "success": false, "error": { "code": "...", "message": "...", "details": [...] } }
 */
export const errorHandler = (err, req, res, _next) => {
  // If it's an instance of ApiError
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error({ err, path: req.path, method: req.method }, err.message);
    }
    return errorResponse(res, err.code, err.message, err.statusCode, err.details);
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    const details = err.errors?.map((e) => ({
      path: e.path.join('.') || 'body',
      message: e.message,
    }));
    return errorResponse(res, 'VALIDATION_ERROR', 'Validation failed', 400, details);
  }

  // Handle JWT expired
  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'TOKEN_EXPIRED', 'Token has expired', 401);
  }

  // Handle invalid JWT
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'UNAUTHORIZED', 'Invalid authentication token', 401);
  }

  // Handle MongoDB Duplicate Key Error (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    const message = `A record with that ${field} already exists`;
    return errorResponse(res, 'CONFLICT', message, 409, [
      { path: field, message: `${field} must be unique` },
    ]);
  }

  // Handle MongoDB CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return errorResponse(res, 'VALIDATION_ERROR', `Invalid ${err.path}: ${err.value}`, 400, [
      { path: err.path, message: 'Invalid format' },
    ]);
  }

  // Handle Malformed JSON parsing error from body-parser
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return errorResponse(res, 'VALIDATION_ERROR', 'Malformed JSON in request body', 400);
  }

  // Catch-all unhandled errors
  logger.error({ err, path: req.path, method: req.method }, 'Unhandled internal error');

  const message =
    env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Internal server error';

  return errorResponse(res, 'INTERNAL', message, 500);
};
