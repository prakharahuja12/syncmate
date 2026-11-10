/**
 * Wraps an async route handler or middleware to catch any errors and pass them to next().
 *
 * @param {Function} fn
 * @returns {Function} Express middleware handler
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
