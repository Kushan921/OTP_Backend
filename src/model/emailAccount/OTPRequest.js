const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const OTPRequest = sequelize.define(
  "OTPRequest",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sessionId: {
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
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
      defaultValue: 'pending',
    },
    requestedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    messageId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "otp_requests",
    timestamps: true,
    indexes: [
      {
        fields: ['status', 'requestedAt']
      },
      {
        fields: ['emailAccountId', 'accountType', 'otpType']
      },
      {
        unique: true,
        fields: ['sessionId']
      }
    ]
  }
);

module.exports = OTPRequest;