const logger = require('../lib/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Request/Response logger middleware
 * Logs all incoming requests and outgoing responses with trace IDs
 */

function requestLogger(req, res, next) {
  // Generate trace ID for request tracking
  const traceId = uuidv4();
  req.traceId = traceId;
  
  // Record start time
  const startTime = Date.now();
  
  // Log incoming request
  logger.info('Incoming request', {
    traceId,
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  });
  
  // Log request body for non-GET requests (but sanitize sensitive data)
  if (req.method !== 'GET' && req.body) {
    const sanitizedBody = sanitizeBody(req.body);
    logger.debug('Request body', { traceId, body: sanitizedBody });
  }
  
  // Capture original end function
  const originalEnd = res.end;
  
  // Override end function to log response
  res.end = function(...args) {
    // Calculate duration
    const duration = Date.now() - startTime;
    
    // Log outgoing response
    logger.info('Outgoing response', {
      traceId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
    
    // Call original end function
    originalEnd.apply(res, args);
  };
  
  next();
}

/**
 * Sanitize sensitive data from request body
 */
function sanitizeBody(body) {
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * Error logger middleware
 * Logs all errors with trace IDs
 */
function errorLogger(err, req, res, next) {
  logger.error('Request error', {
    traceId: req.traceId,
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url
  });
  
  next(err);
}

module.exports = {
  requestLogger,
  errorLogger
};
