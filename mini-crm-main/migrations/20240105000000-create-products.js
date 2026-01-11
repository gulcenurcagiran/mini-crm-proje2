'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      sku: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add index on SKU for faster lookups
    await queryInterface.addIndex('products', ['sku']);
    
    // Add index on category for filtering
    await queryInterface.addIndex('products', ['category']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('products');
  }
};
