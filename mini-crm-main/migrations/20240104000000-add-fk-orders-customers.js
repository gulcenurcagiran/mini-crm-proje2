'use strict';

/**
 * Migration: Add foreign key constraint for orders.customer_id
 * This migration adds referential integrity between orders and customers tables.
 * Previously, customer_id had no FK constraint, allowing orphaned orders.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add foreign key constraint
    await queryInterface.addConstraint('orders', {
      fields: ['customer_id'],
      type: 'foreign key',
      name: 'fk_orders_customer_id',
      references: {
        table: 'customers',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface) {
    // Remove foreign key constraint
    await queryInterface.removeConstraint('orders', 'fk_orders_customer_id');
  }
};
