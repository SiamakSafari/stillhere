/**
 * Standardized API response utilities
 */

/**
 * Success response
 */
export const success = (res, data, statusCode = 200) => {
  return res.status(statusCode).json(data);
};

/**
 * Created response (201)
 */
export const created = (res, data) => {
  return res.status(201).json(data);
};

/**
 * Error response with standardized format
 */
export const error = (res, message, statusCode = 500, code = null, details = null) => {
  const response = {
    error: message,
    code: code || getErrorCode(statusCode)
  };
  
  if (details) {
    response.details = details;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Not found error (404)
 */
export const notFound = (res, message = 'Resource not found') => {
  return error(res, message, 404, 'NOT_FOUND');
};

/**
 * Bad request error (400)
 */
export const badRequest = (res, message = 'Bad request', details = null) => {
  return error(res, message, 400, 'BAD_REQUEST', details);
};

/**
 * Unauthorized error (401)
 */
export const unauthorized = (res, message = 'Authentication required') => {
  return error(res, message, 401, 'UNAUTHORIZED');
};

/**
 * Forbidden error (403)
 */
export const forbidden = (res, message = 'Access denied') => {
  return error(res, message, 403, 'FORBIDDEN');
};

/**
 * Conflict error (409)
 */
export const conflict = (res, message = 'Resource already exists', data = null) => {
  const response = { error: message, code: 'CONFLICT' };
  if (data) response.data = data;
  return res.status(409).json(response);
};

/**
 * Rate limit error (429)
 */
export const tooManyRequests = (res, message = 'Too many requests') => {
  return error(res, message, 429, 'RATE_LIMIT_EXCEEDED');
};

/**
 * Internal server error (500)
 */
export const serverError = (res, message = 'Internal server error') => {
  return error(res, message, 500, 'INTERNAL_ERROR');
};

/**
 * Get error code from status code
 */
function getErrorCode(statusCode) {
  const codes = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'RATE_LIMIT_EXCEEDED',
    500: 'INTERNAL_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE'
  };
  return codes[statusCode] || 'ERROR';
}

export default {
  success,
  created,
  error,
  notFound,
  badRequest,
  unauthorized,
  forbidden,
  conflict,
  tooManyRequests,
  serverError
};
