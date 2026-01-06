const OTPRequest = require('../model/emailAccount/OTPRequest');
const ProcessedEmail = require('../model/emailAccount/ProcessedEmail');
const EmailAccount = require('../model/emailAccount/EmailAccount');
const { google } = require('googleapis');
const { chromium } = require('playwright');

// Function to extract email body from Gmail message payload
function extractEmailBody(payload) {
  const parts = payload.parts || [];
  let bodyData = "";

  function findBody(parts) {
    for (const part of parts) {
      if (part.mimeType === "text/plain" && part.body?.data)
        return part.body.data;
      if (part.mimeType === "text/html" && part.body?.data)
        return part.body.data;
      if (part.parts) {
        const nested = findBody(part.parts);
        if (nested) return nested;
      }
    }
    return null;
  }

  if (parts.length > 0) {
    bodyData = findBody(parts);
  } else if (payload.body?.data) {
    bodyData = payload.body.data;
  }

  if (!bodyData) return null;

  const buff = Buffer.from(bodyData, "base64url");
  return buff.toString("utf8");
}

// Extract OTP from text
function extractOTP(text) {
  const regexes = [
    // Generic OTP
    /(?:otp|verification|password|pin|passcode|security code)[^\d]{0,20}(\d{4,8})/i,

    // "Enter this code to sign in\n1234"
    /Enter this code to sign in[\s\S]*?(\d{4,8})/i,

    // Standalone 4–6 digit number on its own line
    /^\s*(\d{4,8})\s*$/m,
  ];

  for (const regex of regexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}


// Extract link from body
function extractLinkFromBody(body) {
  const regex = /https?:\/\/[^\s"]*netflix[^\s">]*/gi;
  const matches = body.match(regex);
  return matches ? matches[0] : null;
}

// Use Playwright to extract OTP from a URL
async function extractOTPFromLink(url) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    const content = await page.content();
    return extractOTP(content);
  } catch (error) {
    console.error("Playwright error:", error.message);
    return null;
  } finally {
    await browser.close();
  }
}

async function processOTPRequests() {
  
  const pendingRequests = await OTPRequest.findAll({
    where: { 
      status: 'pending', 
      accountType: 'netflix' 
    }
  });

  for (const req of pendingRequests) {
    try {
      const emailAccount = await EmailAccount.findByPk(req.emailAccountId);
      if (!emailAccount?.accessToken) {
        console.log(`No accessToken for emailAccount ${req.emailAccountId}`);
        continue;
      }

      const auth = new google.auth.OAuth2();
      const now = Date.now();

      if (!emailAccount.tokenExpires || new Date(emailAccount.tokenExpires).getTime() <= now) {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI
        );

        oauth2Client.setCredentials({
          refresh_token: emailAccount.refreshToken,
        });
        
        const newTokens = await oauth2Client.refreshAccessToken();
        const tokens = newTokens.credentials;
        await emailAccount.update({
          accessToken: tokens.access_token,
          tokenExpires: new Date(tokens.expiry_date),
        });
        auth.setCredentials({ access_token: tokens.access_token });
      } else {
        auth.setCredentials({ access_token: emailAccount.accessToken });
      }

      const gmail = google.gmail({ version: 'v1', auth });

      // currently only netflix is supported 
      const query = `
        from:info@account.netflix.com
        newer_than:1d
      `;

      const messages = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 50,
      });

      if (!messages.data.messages) continue;

      const messageIds = messages.data.messages || [];

      for (let i = messageIds.length - 1; i >= 0; i--) {
        const msg = messageIds[i];
        const alreadyProcessed = await ProcessedEmail.findOne({
          where: { messageId: msg.id },
        });
        
        if (alreadyProcessed) continue;

        const message = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full',
        });

        const emailBody = extractEmailBody(message.data.payload);
        if (!emailBody) continue;

        let otp = null;
        let otpSource = null;

        if (req.otpType === 'signin') {
          // OTP MUST be inside email
          otp = extractOTP(emailBody);
          otpSource = 'email_body';
        }

        if (req.otpType === 'temporary') {
          // OTP ONLY comes from link
          const link = extractLinkFromBody(emailBody);
          console.log("This is link :",link);
          
          if (link) {
            otp = await extractOTPFromLink(link);
            otpSource = 'link';
          }
        }

        if (!otp) continue;

        // Save OTP and update the OTP request status
        await OTPRequest.update(
          {
            status: 'completed',
            otp: otp,
            completedAt: new Date(),
          },
          { where: { id: req.id } }
        );
        
        await ProcessedEmail.create({
          messageId: msg.id,
          emailAccountId: emailAccount.id,
          accountType: req.accountType,
          otpType: req.otpType,
        });
        break;
      }
    } catch (err) {
      await OTPRequest.update(
        { status: 'failed', error: err.message },
        { where: { id: req.id } }
      );
    }
  }
}
 
module.exports = processOTPRequests;
