import rateLimit from 'express-rate-limit';
import { errorResponse } from '../utils/response.js';
import { env } from '../config/env.js';

const rateLimitHandler = (_req, res) => {
  return errorResponse(res, 'RATE_LIMITED', 'Too many requests, please try again later', 429);
};

// General rate limiter: 100 requests per minute per IP
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: () => env.NODE_ENV === 'test',
});

// Stricter rate limiter for authentication endpoints: 10 requests per minute per IP
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: () => env.NODE_ENV === 'test',
});
