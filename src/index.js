// Load environment variables
const dotenv = require("dotenv");
dotenv.config();

// Load cron jobs
const cron = require("node-cron");
require("./cron"); 

// Core modules
const path = require("path");

// Express and middleware
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// Database
const sequelize = require("./config/database");

// Routes
const adminRoutes = require("./router/admin/AdminRouter");
const accountTypeRoutes = require("./router/accountType/AccountTypeRouter");
const emailAccountRoutes = require("./router/emailAccount/EmailAccountRouter");
const customerRoutes = require("./router/Customer/CustomerRouter");
const gmailRoutes = require("./router/gmail/gmail");
const otpRoutes = require("./router/otp/otpRoutes");
const cronRouter = require("./router/cron/cronRouter");

// Models
const AccountType = require("./model/accountType/AccountType");
const EmailAccount = require("./model/emailAccount/EmailAccount");
const Customer = require("./model/Customer/Customer");
const ProcessedEmail = require("./model/emailAccount/ProcessedEmail");
const OTPRequest = require("./model/emailAccount/OTPRequest");

// Optional favicon handling
const faviconPath = path.join(__dirname, "public", "favicon.ico");

class App {
  constructor() {
    this.app = express();
    this.plugins();
    this.routes();
    this.DatabaseSync();
  }

  plugins() {
    // CORS configuration
    const corsOptions = {
      origin: "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 204,
    };

    this.app.use(cors(corsOptions));
    this.app.options("*", cors(corsOptions));

    // Body parser & cookies
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());

    // Favicon handling
    // If you have a favicon.ico file in 'public', it will serve it
    // Otherwise, just ignore the request
    const fs = require("fs");
    if (fs.existsSync(faviconPath)) {
      const favicon = require("serve-favicon");
      this.app.use(favicon(faviconPath));
    } else {
      // Prevent 404 errors if favicon does not exist
      this.app.get("/favicon.ico", (req, res) => res.sendStatus(204));
    }
  }

  routes() {
    this.app.use("/api/v1/account-types", accountTypeRoutes);
    this.app.use("/api/v1/email-accounts", emailAccountRoutes);
    this.app.use("/api/v1/customers", customerRoutes);
    this.app.use("/api/v1/admin", adminRoutes);
    this.app.use("/api/v1/gmail", gmailRoutes);
    this.app.use("/api/v1/otp", otpRoutes);
    this.app.use("/api/v1/cron", cronRouter);

    // Default home route
    this.app.get("/", (req, res) => {
      res.send("Welcome to Home");
    });
  }

  async DatabaseSync() {
    try {
      // Set up associations if defined
      EmailAccount.associate?.({ AccountType, Customer });
      Customer.associate?.({ AccountType, EmailAccount });
      AccountType.associate?.({ Customer, EmailAccount });

      // Sync database
      await sequelize.sync({ alter: true });
      console.log("Database synced successfully");
    } catch (err) {
      console.error("Failed to sync database:", err);
    }
  }
}

// Start server
const port = process.env.PORT || 8000;
const appInstance = new App();
const app = appInstance.app;

app.listen(port, () => {
  console.log(`Server started at port: ${port}`);
});
