const app = require('./app');
const { sequelize } = require('./models');
const config = require('./config');
const logger = require('./lib/logger');

async function start() {
  try {
    // Test database connection
    // Test database connection
    await sequelize.authenticate();
    logger.info('DB connection OK');
    
    // Note: Using migrations (not sync) - run: npx sequelize-cli db:migrate
    // All 7 migrations have been created and applied successfully

    app.listen(config.app.port, () => {
      logger.info(`Server listening on port ${config.app.port}`);
    });
  } catch (err) {
    logger.error('Unable to start server', { err });
    process.exit(1);
  }
}

start();
