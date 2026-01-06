const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const { chromium } = require("playwright");
require("dotenv").config();

const EmailAccount = require("../../model/emailAccount/EmailAccount");
const ProcessedEmail = require("../../model/emailAccount/ProcessedEmail");
const OTPRequest = require("../../model/emailAccount/OTPRequest");

// OAuth client
function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

// Account type configurations for OTP extraction
const ACCOUNT_TYPE_CONFIGS = {
  netflix: {
    sender: "netflix.com",
    otpTypes: {
      signin: {
        subjectKeywords: ["sign in", "login", "verification"],
        bodyKeywords: ["sign in to your account", "verification code", "code to sign in"],
      },
      temporary: {
        subjectKeywords: ["temporary", "access"],
        bodyKeywords: ["temporary access code", "temporary code"],
      },
      household: {
        subjectKeywords: ["household", "family", "member"],
        bodyKeywords: ["household link", "family member", "join household"],
        hasLink: true,
      },
    },
  },
  chatgpt: {
    sender: "openai.com",
    otpTypes: {
      signin: {
        subjectKeywords: ["verification", "code"],
        bodyKeywords: ["verification code", "your code"],
      },
    },
  },
};

// Extract OTP from text
function extractOTP(text) {
  const regexes = [
    /(?:otp|code|verification|password|pin|passcode|security code)[^\d]{0,10}(\d{4,8})/i,
    /(\d{4,8})\s*(?:is your|as your|for your) (?:otp|code)/i,
  ];
  for (const regex of regexes) {
    const match = text.match(regex);
    if (match && match[1]) return match[1];
  }
  return "No OTP found";
}

// Extract link from email body
function extractLinkFromBody(body, keyword = "") {
  const regex = new RegExp(`https?:\\/\\/(www\\.)?[^\\s"]*${keyword}[^\\s">]*`, "gi");
  const matches = body.match(regex);
  return matches ? matches[0] : null;
}

// Playwright OTP extraction from link
async function extractOTPFromLink(url) {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    const content = await page.content();
    return extractOTP(content);
  } catch (error) {
    console.error("Playwright error:", error.message);
    return "No OTP found in link";
  } finally {
    await browser.close();
  }
}

// Extract email body from Gmail payload
function extractEmailBody(payload) {
  const parts = payload.parts || [];
  let bodyData = "";

  function findBody(parts) {
    for (const part of parts) {
      if ((part.mimeType === "text/plain" || part.mimeType === "text/html") && part.body?.data) {
        return part.body.data;
      }
      if (part.parts) {
        const nested = findBody(part.parts);
        if (nested) return nested;
      }
    }
    return null;
  }

  bodyData = parts.length > 0 ? findBody(parts) : payload.body?.data;
  if (!bodyData) return null;

  return Buffer.from(bodyData, "base64url").toString("utf8");
}

// Background OTP processing
async function processOTPRequest(requestId) {
  try {
    const otpRequest = await OTPRequest.findByPk(requestId);
    if (!otpRequest || otpRequest.status !== "pending") return;

    await otpRequest.update({ status: "processing" });
    const account = await EmailAccount.findByPk(otpRequest.emailAccountId);
    if (!account) {
      await otpRequest.update({ status: "failed", error: "Email account not found" });
      return;
    }

    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials({
      refresh_token: account.refreshToken,
      access_token: account.accessToken,
      expiry_date: account.tokenExpires ? new Date(account.tokenExpires).getTime() : null,
    });

    // Refresh token if expired
    const now = Date.now();
    if (!account.tokenExpires || new Date(account.tokenExpires).getTime() <= now) {
      const newTokens = await oauth2Client.refreshAccessToken();
      const tokens = newTokens.credentials;
      await account.update({
        accessToken: tokens.access_token,
        tokenExpires: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      });
      oauth2Client.setCredentials(tokens);
    }

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const config = ACCOUNT_TYPE_CONFIGS[otpRequest.accountType];
    const otpConfig = config.otpTypes[otpRequest.otpType];

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const query = `from:${config.sender} after:${Math.floor(fiveMinutesAgo.getTime() / 1000)}`;

    const messagesRes = await gmail.users.messages.list({
      userId: "me",
      maxResults: 10,
      q: query,
    });

    if (!messagesRes.data.messages || messagesRes.data.messages.length === 0) {
      const requestAge = Date.now() - new Date(otpRequest.requestedAt).getTime();
      if (requestAge < 2 * 60 * 1000) {
        return setTimeout(() => processOTPRequest(requestId), 10000);
      } else {
        await otpRequest.update({ status: "failed", error: "No emails found within timeout period" });
        return;
      }
    }

    for (const message of messagesRes.data.messages) {
      const alreadyProcessed = await ProcessedEmail.findOne({
        where: { messageId: message.id, emailAccountId: otpRequest.emailAccountId },
      });
      if (alreadyProcessed) continue;

      try {
        const messageRes = await gmail.users.messages.get({
          userId: "me",
          id: message.id,
          format: "full",
        });

        const headers = messageRes.data.payload.headers || [];
        const getHeaderValue = (name) => {
          const header = headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
          return header ? header.value : "";
        };

        const subject = getHeaderValue("Subject");
        const emailBody = extractEmailBody(messageRes.data.payload);
        if (!emailBody) continue;

        const matchesType =
          otpConfig.subjectKeywords.some((kw) => subject.toLowerCase().includes(kw.toLowerCase())) ||
          otpConfig.bodyKeywords.some((kw) => emailBody.toLowerCase().includes(kw.toLowerCase()));

        if (!matchesType) continue;

        let otp = extractOTP(emailBody);
        let otpSource = "email_body";

        if (otpConfig.hasLink && otp === "No OTP found") {
          const link = extractLinkFromBody(emailBody, otpRequest.accountType);
          if (link) {
            otp = await extractOTPFromLink(link);
            otpSource = "link";
          }
        }

        if (otp !== "No OTP found") {
          await ProcessedEmail.create({
            messageId: message.id,
            emailAccountId: otpRequest.emailAccountId,
            accountType: otpRequest.accountType,
            otpType: otpRequest.otpType,
          });

          await otpRequest.update({
            status: "completed",
            otp,
            messageId: message.id,
            completedAt: new Date(),
          });

          return;
        }
      } catch (emailError) {
        console.error(`Error processing message ${message.id}:`, emailError);
        continue;
      }
    }

    const requestAge = Date.now() - new Date(otpRequest.requestedAt).getTime();
    if (requestAge < 2 * 60 * 1000) {
      return setTimeout(() => processOTPRequest(requestId), 15000);
    } else {
      await otpRequest.update({ status: "failed", error: "No matching OTP found within timeout period" });
    }
  } catch (error) {
    console.error("Error processing OTP request:", error);
    await OTPRequest.update({ status: "failed", error: error.message }, { where: { id: requestId } });
  }
}

// OAuth connect (no password required anymore)
router.get("/connect", (req, res) => {
  const oauth2Client = createOAuthClient();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });

  // No sensitive data in state; use a static hint if needed
  res.redirect(authUrl);
});

// OAuth callback (no password handled or stored)
router.get("/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("Missing authorization code");

  try {
    const oauth2Client = createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: "me" });
    const emailAddress = profile.data.emailAddress;

    let account = await EmailAccount.findOne({ where: { email: emailAddress } });

    if (account) {
      await account.update({
        refreshToken: tokens.refresh_token || account.refreshToken,
        accessToken: tokens.access_token,
        tokenExpires: tokens.expiry_date ? new Date(tokens.expiry_date) : account.tokenExpires,
        provider: "gmail",
        isActive: true,
      });
    } else {
      await EmailAccount.create({
        email: emailAddress,
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token,
        tokenExpires: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        provider: "gmail",
        isActive: true,
      });
    }

    res.redirect(`http://localhost:5173/admin/email/success?email=${encodeURIComponent(emailAddress)}`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.status(500).send("Failed to connect Gmail account.");
  }
});

// Request OTP
router.post("/request/:emailAccountId", async (req, res) => {
  try {
    const { emailAccountId } = req.params;
    const { accountType, otpType, sessionId } = req.body;

    if (!accountType || !otpType || !sessionId)
      return res.status(400).json({ error: "accountType, otpType, and sessionId are required" });

    if (!ACCOUNT_TYPE_CONFIGS[accountType] || !ACCOUNT_TYPE_CONFIGS[accountType].otpTypes[otpType])
      return res.status(400).json({ error: `Unsupported account type or OTP type` });

    const account = await EmailAccount.findByPk(emailAccountId);
    if (!account) return res.status(404).json({ error: "Email account not found" });

    const existingRequest = await OTPRequest.findOne({
      where: { sessionId, status: ["pending", "processing"] },
    });
    if (existingRequest)
      return res.status(409).json({ error: "Session already has a pending OTP request", requestId: existingRequest.id });

    const otpRequest = await OTPRequest.create({
      sessionId,
      emailAccountId: parseInt(emailAccountId),
      accountType,
      otpType,
      status: "pending",
    });

    processOTPRequest(otpRequest.id); // run in background

    res.status(201).json({
      message: "OTP request queued successfully",
      requestId: otpRequest.id,
      sessionId,
      status: "processing",
    });
  } catch (error) {
    console.error("Error creating OTP request:", error);
    res.status(500).json({ error: "Failed to create OTP request" });
  }
});

// Check OTP request status
router.get("/status/:requestId", async (req, res) => {
  try {
    const otpRequest = await OTPRequest.findByPk(req.params.requestId);
    if (!otpRequest) return res.status(404).json({ error: "OTP request not found" });

    res.json({
      requestId: otpRequest.id,
      sessionId: otpRequest.sessionId,
      status: otpRequest.status,
      accountType: otpRequest.accountType,
      otpType: otpRequest.otpType,
      requestedAt: otpRequest.requestedAt,
      ...(otpRequest.status === "completed" && { otp: otpRequest.otp, completedAt: otpRequest.completedAt }),
      ...(otpRequest.status === "failed" && { error: otpRequest.error }),
    });
  } catch (error) {
    console.error("Error checking OTP status:", error);
    res.status(500).json({ error: "Failed to check OTP status" });
  }
});

// Fetch latest OTP
router.get("/latest/:emailAccountId", async (req, res) => {
  try {
    const { emailAccountId } = req.params;
    const { accountType, otpType } = req.query;

    if (!accountType || !otpType)
      return res.status(400).json({ error: "accountType and otpType query parameters are required" });
    if (!ACCOUNT_TYPE_CONFIGS[accountType] || !ACCOUNT_TYPE_CONFIGS[accountType].otpTypes[otpType])
      return res.status(400).json({ error: "Unsupported account type or OTP type" });

    const account = await EmailAccount.findByPk(emailAccountId);
    if (!account) return res.status(404).json({ error: "Email account not found" });

    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials({
      refresh_token: account.refreshToken,
      access_token: account.accessToken,
      expiry_date: account.tokenExpires ? new Date(account.tokenExpires).getTime() : null,
    });

    // Refresh if expired
    if (!account.tokenExpires || new Date(account.tokenExpires).getTime() <= Date.now()) {
      const newTokens = await oauth2Client.refreshAccessToken();
      const tokens = newTokens.credentials;
      await account.update({
        accessToken: tokens.access_token,
        tokenExpires: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      });
      oauth2Client.setCredentials(tokens);
    }

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const config = ACCOUNT_TYPE_CONFIGS[accountType];
    const otpConfig = config.otpTypes[otpType];

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const query = `from:${config.sender} after:${Math.floor(tenMinutesAgo.getTime() / 1000)}`;

    const messagesRes = await gmail.users.messages.list({ userId: "me", maxResults: 20, q: query });
    if (!messagesRes.data.messages || messagesRes.data.messages.length === 0)
      return res.status(404).json({ message: `No recent emails found from ${config.sender}` });

    for (const message of messagesRes.data.messages) {
      const alreadyProcessed = await ProcessedEmail.findOne({
        where: { messageId: message.id, emailAccountId: parseInt(emailAccountId) },
      });
      if (alreadyProcessed) continue;

      try {
        const messageRes = await gmail.users.messages.get({ userId: "me", id: message.id, format: "full" });
        const headers = messageRes.data.payload.headers || [];
        const getHeaderValue = (name) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
        const from = getHeaderValue("From");
        const to = getHeaderValue("To");
        const subject = getHeaderValue("Subject");
        const date = getHeaderValue("Date");
        const emailBody = extractEmailBody(messageRes.data.payload);
        if (!emailBody) continue;

        const matchesType =
          otpConfig.subjectKeywords.some((kw) => subject.toLowerCase().includes(kw.toLowerCase())) ||
          otpConfig.bodyKeywords.some((kw) => emailBody.toLowerCase().includes(kw.toLowerCase()));

        if (!matchesType) continue;

        let otp = extractOTP(emailBody);
        let otpSource = "email_body";

        if (otpConfig.hasLink && otp === "No OTP found") {
          const link = extractLinkFromBody(emailBody, accountType);
          if (link) {
            otp = await extractOTPFromLink(link);
            otpSource = "link";
          }
        }

        if (otp !== "No OTP found") {
          await ProcessedEmail.create({ messageId: message.id, emailAccountId: parseInt(emailAccountId), accountType, otpType });
          return res.json({ from, to, subject, date, snippet: messageRes.data.snippet, otp, otpSource, accountType, otpType, messageId: message.id });
        }
      } catch (emailError) {
        console.error(`Error processing message ${message.id}:`, emailError);
        continue;
      }
    }

    res.status(404).json({ message: `No unprocessed ${otpType} OTP found for ${accountType} in recent emails` });
  } catch (error) {
    console.error("Error fetching latest email:", error);
    res.status(500).json({ error: "Failed to fetch OTP" });
  }
});

module.exports = router;
