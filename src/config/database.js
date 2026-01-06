const { Sequelize } = require("sequelize");

class Database {
  constructor() {
    this.sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false, // allows self-signed certs for dev
        },
      },
    });
    this.authenticate();
  }

  async authenticate() {
    try {
      await this.sequelize.authenticate();
      console.log("Database connection has been established successfully.");
    } catch (error) {
      console.error("Unable to connect to the database:", error);
    }
  }
}

const database = new Database();
module.exports = database.sequelize;
