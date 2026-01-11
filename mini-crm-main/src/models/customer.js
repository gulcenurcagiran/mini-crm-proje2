// Note: Migration and model intentionally differ slightly for flexibility
// The isActive field was added via migration 20240103000000
module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false // ama ETL verisinde boş gelebiliyor
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true // Decision: Keep optional for flexibility
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      // Note: Email validation implemented in src/validators/customerValidator.js (Zod)
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Migration'da yok:
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'customers',
    underscored: true
  });

  return Customer;
};
