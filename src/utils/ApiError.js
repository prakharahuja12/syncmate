/**
 * Custom application error aligning with the API Contract.
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode
   * @param {string} code
   * @param {string} message
   * @param {Array<{ path: string, message: string }> | undefined} details
   */
  constructor(statusCode, code, message, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Invalid request', details = undefined) {
    return new ApiError(400, 'VALIDATION_ERROR', message, details);
  }

  static unauthorized(message = 'Authentication required', code = 'UNAUTHORIZED') {
    return new ApiError(401, code, message);
  }

  static tokenExpired(message = 'Token has expired') {
    return new ApiError(401, 'TOKEN_EXPIRED', message);
  }

  static forbidden(message = 'Access forbidden') {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static conflict(message = 'Resource conflict', code = 'CONFLICT') {
    return new ApiError(409, code, message);
  }

  static groupFull(message = 'Group has reached maximum member limit') {
    return new ApiError(409, 'GROUP_FULL', message);
  }

  static inviteInvalid(message = 'Invite code is invalid or has expired') {
    return new ApiError(410, 'INVITE_INVALID', message);
  }

  static rateLimited(message = 'Too many requests, please try again later') {
    return new ApiError(429, 'RATE_LIMITED', message);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, 'INTERNAL', message);
  }
}
