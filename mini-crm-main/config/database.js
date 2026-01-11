require('dotenv').config();

// Config for Sequelize CLI migrations
module.exports = {
  development: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'mini_crm',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || null,
    dialect: 'postgres',
    logging: false
  },
  test: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'mini_crm',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || null,
    dialect: 'postgres',
    logging: false
  },
  production: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    dialect: 'postgres',
    logging: false
  }
};
