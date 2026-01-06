const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const ProcessedEmail = sequelize.define(
  "ProcessedEmail",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    messageId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    emailAccountId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    accountType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    otpType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    processedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "processed_emails",
    timestamps: true,
  }
);

module.exports = ProcessedEmail;