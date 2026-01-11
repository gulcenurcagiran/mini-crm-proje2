const rateLimit = require('express-rate-limit');

/**
 * Rate limiting middleware
 * Prevents abuse by limiting requests per IP address
 */

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limiter for authentication/sensitive endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    message: 'Too many failed attempts, please try again later.',
    retryAfter: '15 minutes'
  }
});

// Less strict rate limiter for read-only endpoints
const readLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    message: 'Too many requests, please slow down.',
    retryAfter: '1 minute'
  }
});

// Very strict rate limiter for write operations
const writeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 write operations per minute
  message: {
    message: 'Too many write operations, please try again later.',
    retryAfter: '1 minute'
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  readLimiter,
  writeLimiter
};
