const { Sequelize } = require('sequelize');
const config = require('../config');
const logger = require('../lib/logger');

const sequelize = new Sequelize(
  config.db.database,
  config.db.username,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    logging: process.env.NODE_ENV === 'test' ? false : msg => logger.debug(msg) // DONE: Disabled in test environment
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Modeller
db.Customer = require('./customer')(sequelize, Sequelize.DataTypes);
db.Order = require('./order')(sequelize, Sequelize.DataTypes);
db.Product = require('./product')(sequelize, Sequelize.DataTypes);
db.OrderItem = require('./orderItem')(sequelize, Sequelize.DataTypes);
db.Stock = require('./stock')(sequelize, Sequelize.DataTypes);

// İlişkiler
// Customer - Order
db.Customer.hasMany(db.Order, { foreignKey: 'customerId', as: 'orders' });
db.Order.belongsTo(db.Customer, { foreignKey: 'customerId', as: 'customer' });

// Order - OrderItem - Product
db.Order.hasMany(db.OrderItem, { foreignKey: 'orderId', as: 'items' });
db.OrderItem.belongsTo(db.Order, { foreignKey: 'orderId', as: 'order' });

db.Product.hasMany(db.OrderItem, { foreignKey: 'productId', as: 'orderItems' });
db.OrderItem.belongsTo(db.Product, { foreignKey: 'productId', as: 'product' });

// Product - Stock (one-to-one)
db.Product.hasOne(db.Stock, { foreignKey: 'productId', as: 'stock' });
db.Stock.belongsTo(db.Product, { foreignKey: 'productId', as: 'product' });

module.exports = db;
