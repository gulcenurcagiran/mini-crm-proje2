const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const logger = require('./lib/logger');
const { apiLimiter } = require('./middleware/rateLimiter');
const { requestLogger, errorLogger } = require('./middleware/logger');

const customersRouter = require('./routes/customers');
const ordersRouter = require('./routes/orders');
const productsRouter = require('./routes/products');

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*', // In production, set specific origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Request/response logger with trace IDs
app.use(requestLogger);

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Mini-CRM API Documentation'
}));

// API Routes
app.use('/api/customers', customersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/products', productsRouter);

// Error logger middleware
app.use(errorLogger);

// Hata yakalama (detaysız)
app.use((err, req, res, next) => {
  res.status(500).json({ 
    message: 'Internal server error',
    traceId: req.traceId // Include trace ID for debugging
  });
});

module.exports = app;
