const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const AccountType = sequelize.define(
  "AccountType",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "account_types",
    timestamps: true,
  }
);

AccountType.associate = (models) => {
  AccountType.belongsToMany(models.EmailAccount, {
    through: "EmailAccountTypes",
    foreignKey: "accountTypeId",
  });
  AccountType.belongsToMany(models.Customer, {
    through: "CustomerAccountTypes",
    foreignKey: "accountTypeId",
  });
};

module.exports = AccountType;
