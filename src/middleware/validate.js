import { ApiError } from '../utils/ApiError.js';

/**
 * Express middleware for validating request inputs with Zod.
 * Unknown keys are stripped during schema parsing.
 *
 * @param {import('zod').ZodSchema} schema Zod schema to validate against
 * @param {'body' | 'query' | 'params'} [source='body'] The request property to validate
 */
export const validate = (schema, source = 'body') => {
  return (req, _res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err.name === 'ZodError') {
        const details = err.errors.map((e) => ({
          path: e.path.join('.') || source,
          message: e.message,
        }));
        return next(ApiError.badRequest('Validation failed', details));
      }
      next(err);
    }
  };
};
