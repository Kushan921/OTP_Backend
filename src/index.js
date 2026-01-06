const dotenv = require("dotenv");
dotenv.config();
const cron = require('node-cron');
require('./cron');  // Load the cron jobs

const express = require("express");
const cors = require("cors");
const sequelize = require("./config/database");
const cookieParser = require('cookie-parser');

const adminRoutes = require("./router/admin/AdminRouter");
const accountTypeRoutes = require("./router/accountType/AccountTypeRouter");
const emailAccountRoutes = require("./router/emailAccount/EmailAccountRouter");
const customerRoutes = require("./router/Customer/CustomerRouter");
const gmailRoutes = require("./router/gmail/gmail");
const otpRoutes = require("./router/otp/otpRoutes");
const cronRouter = require("./router/cron/cronRouter");

const AccountType = require("./model/accountType/AccountType");
const EmailAccount = require("./model/emailAccount/EmailAccount");
const Customer = require("./model/Customer/Customer");
const ProcessedEmail = require("./model/emailAccount/ProcessedEmail");
const OTPRequest = require("./model/emailAccount/OTPRequest");

class App {
  constructor() {
    this.app = express();
    this.plugins();
    this.routes();
    this.DatabaseSync();
  }

  plugins() {
    const corsOptions = {
      origin: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 204,
    };

    this.app.use(cors(corsOptions));
    this.app.options("*", cors(corsOptions));

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
  }

  routes() {
    this.app.use("/api/v1/account-types", accountTypeRoutes);
    this.app.use("/api/v1/email-accounts", emailAccountRoutes);
    this.app.use("/api/v1/customers", customerRoutes);
    this.app.use("/api/v1/admin", adminRoutes);
    this.app.use("/api/v1/gmail", gmailRoutes);
    this.app.use("/api/v1/otp", otpRoutes);
    this.app.use("/api/v1/cron", cronRouter);

    this.app.get("/", (req, res) => {
      res.send("Welcome to Home");
    });
  }

  async DatabaseSync() {
    try {
      EmailAccount.associate?.({ AccountType, Customer });
      Customer.associate?.({ AccountType, EmailAccount });
      AccountType.associate?.({ Customer, EmailAccount });

      await sequelize.sync({ alter: true });
      console.log("Database synced successfully");
    } catch (err) {
      console.error("Failed to sync database:", err);
    }
  }
}

const port = process.env.PORT || 8000;
const appInstance = new App();
const app = appInstance.app;

app.listen(port, () => {
  console.log(`Server started at port : ${port}`);
});
