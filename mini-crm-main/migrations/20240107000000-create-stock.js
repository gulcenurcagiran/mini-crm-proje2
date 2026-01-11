'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stock', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true, // One stock record per product
        references: {
          model: 'products',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      reserved_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Quantity reserved in pending orders'
      },
      reorder_level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 10,
        comment: 'Minimum stock level before reordering'
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

    // Add index on product_id for faster lookups
    await queryInterface.addIndex('stock', ['product_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('stock');
  }
};
