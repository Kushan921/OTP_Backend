const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const EmailAccount = sequelize.define(
  "EmailAccount",
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
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    accessToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    refreshToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tokenExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "email_accounts",
    timestamps: true,
  }
);

EmailAccount.associate = (models) => {
  EmailAccount.belongsToMany(models.AccountType, {
    through: "EmailAccountTypes",
    foreignKey: "emailAccountId",
  });
  EmailAccount.belongsToMany(models.Customer, {
    through: "CustomerEmailAccount",
    foreignKey: "emailAccountId",
  });
};

module.exports = EmailAccount;
