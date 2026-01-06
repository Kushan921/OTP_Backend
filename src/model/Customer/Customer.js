const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const Customer = sequelize.define(
  "Customer",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "customers",
    timestamps: true,
  }
);

Customer.associate = (models) => {
  Customer.belongsToMany(models.AccountType, {
    through: "CustomerAccountTypes",
    foreignKey: "customerId",
  });
  Customer.belongsToMany(models.EmailAccount, {
    through: "CustomerEmailAccount",
    foreignKey: "customerId",
  });
};

module.exports = Customer;
