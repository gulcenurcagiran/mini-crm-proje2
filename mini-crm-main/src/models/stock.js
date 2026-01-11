module.exports = (sequelize, DataTypes) => {
  const Stock = sequelize.define('Stock', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    reservedQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    reorderLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10
    }
  }, {
    tableName: 'stock',
    underscored: true
  });

  return Stock;
};
