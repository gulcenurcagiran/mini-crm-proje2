'use strict';

/**
 * Note: Foreign key constraint has been added
 * See: migrations/20240104000000-add-fk-orders-customers.js
 * 
 * Note: OrderItems table has been created
 * See: migrations/20240106000000-create-order-items.js
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: false
        // Note: FK constraint added in migration 20240104000000
      },
      status: {
        type: Sequelize.STRING,
        allowNull: true // modelde NOT NULL
      },
      total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      // Note: OrderItems table created in migration 20240106000000
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('orders');
  }
};
