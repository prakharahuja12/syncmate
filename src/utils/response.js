/**
 * Formats and sends a successful JSON response matching the API Contract.
 *
 * @param {import('express').Response} res
 * @param {object} [data={}]
 * @param {number} [statusCode=200]
 * @param {object|null} [meta=null]
 */
export const successResponse = (res, data = {}, statusCode = 200, meta = null) => {
  const payload = {
    success: true,
    data,
  };

  if (meta) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};

/**
 * Formats and sends an error JSON response matching the API Contract.
 *
 * @param {import('express').Response} res
 * @param {string} code
 * @param {string} message
 * @param {number} [statusCode=500]
 * @param {Array<object>|undefined} [details=undefined]
 */
export const errorResponse = (
  res,
  code,
  message,
  statusCode = 500,
  details = undefined
) => {
  const payload = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details && Array.isArray(details) && details.length > 0) {
    payload.error.details = details;
  }

  return res.status(statusCode).json(payload);
};
