'use strict';

/**
 * Migration: Add isActive field to customers table
 * This migration fixes the mismatch between the Customer model and the database schema.
 * The model has isActive field but the original migration didn't include it.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('customers', 'is_active', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('customers', 'is_active');
  }
};
