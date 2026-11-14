import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      }
    });
    logger.info(`SMTP mailer initialized with host: ${host}:${port}`);
  }

  return transporter;
}

/**
 * Send Password Reset OTP Email
 */
export async function sendPasswordResetOtpEmail({ to, name = 'Valued User', otp, expiresInMinutes = 10 }) {
  const from = process.env.SMTP_FROM || '"CampaignFlow Security" <no-reply@campaignflow.io>';
  const subject = `Your Password Reset Code: ${otp} - CampaignFlow`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset OTP</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
        .wrapper { max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 32px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0 0; font-size: 13px; color: #94a3b8; }
        .content { padding: 32px; }
        .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #0f172a; }
        .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .otp-box { background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #166534; margin-bottom: 8px; }
        .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #15803d; font-family: 'Courier New', Courier, monospace; margin: 0; }
        .timer-badge { display: inline-block; background: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 12px; }
        .security-notice { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 0 6px 6px 0; font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 24px; }
        .footer { padding: 24px 32px; background: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>CampaignFlow</h1>
          <p>WhatsApp Marketing Automation Platform</p>
        </div>
        <div class="content">
          <div class="greeting">Hello ${name},</div>
          <p class="text">
            We received a request to reset your password for your <strong>CampaignFlow</strong> account (${to}). Please use the One-Time Password (OTP) below to verify your identity:
          </p>
          <div class="otp-box">
            <div class="otp-label">Verification OTP Code</div>
            <div class="otp-code">${otp}</div>
            <div class="timer-badge">Valid for ${expiresInMinutes} minutes</div>
          </div>
          <div class="security-notice">
            <strong>Security Notice:</strong> Never share this OTP with anyone, including CampaignFlow support staff. If you did not initiate this password reset request, you can safely ignore this email.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} CampaignFlow SaaS. All rights reserved.<br>
          This is an automated security transmission.
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Hello ${name},\n\nYour CampaignFlow password reset verification code is: ${otp}\n\nThis OTP is valid for ${expiresInMinutes} minutes.\nIf you did not request this, please ignore this email.\n\nCampaignFlow Security Team`;

  const mailTransporter = getTransporter();

  if (mailTransporter) {
    try {
      const info = await mailTransporter.sendMail({
        from,
        to,
        subject,
        text,
        html
      });
      logger.info(`[EMAIL SERVICE] Password reset OTP sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId, isDelivered: true };
    } catch (err) {
      logger.error(`[EMAIL SERVICE] Failed to send email via SMTP: ${err.message}`);
      // Fallback to console output in case of SMTP failure
      logOtpToConsole(to, otp, expiresInMinutes);
      return { success: true, isDelivered: false, simulated: true, error: err.message };
    }
  } else {
    // Development / Local Mode fallback
    logOtpToConsole(to, otp, expiresInMinutes);
    return { success: true, isDelivered: false, simulated: true };
  }
}

function logOtpToConsole(to, otp, expiresInMinutes) {
  console.log('\n======================================================');
  console.log(' [EMAIL SERVICE - MOCK/DEV OUTPUT]');
  console.log(` Target Email : ${to}`);
  console.log(` Verification OTP : ${otp}`);
  console.log(` Expiry : ${expiresInMinutes} minutes`);
  console.log('======================================================\n');
}

export default {
  sendPasswordResetOtpEmail
};

