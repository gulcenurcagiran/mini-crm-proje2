module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: true // Allow guest orders without customer
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending' // müşteri 'hazırlanıyor' demişti, sync değil
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true // nullable bırakılmış
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
    // Note: OrderItems table has been created
    // See: migrations/20240106000000-create-order-items.js
    // Model: src/models/orderItem.js
  }, {
    tableName: 'orders',
    underscored: true
  });

  return Order;
};
