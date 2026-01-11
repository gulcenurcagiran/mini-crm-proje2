require('dotenv').config();

module.exports = {
  app: {
    port: process.env.APP_PORT || 3000,
    // DONE: Environment separation implemented (dev, test, prod)
    env: process.env.NODE_ENV || 'development'
  },
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'mini_crm',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || null,
    dialect: 'postgres',
    logging: false // DONE: Integrated with Winston logger in src/models/index.js
  }
};
