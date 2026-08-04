import dotenv from "dotenv";
dotenv.config();

/**
 * Sends a transactional verification email using Brevo (Sendinblue) SMTP API.
 * Falls back to console log prints if BREVO_API_KEY is not configured.
 * 
 * @param {string} email - Recipient email address
 * @param {string} name - Recipient name
 * @param {string} code - 6-digit verification code
 */
export const sendVerificationEmail = async (email, name, code) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "no-reply@sampark.com";

  if (!apiKey || apiKey === "your_brevo_api_key") {
    console.log(`\n======================================================`);
    console.log(`[Brevo Mock Email Service]`);
    console.log(`Sent verification code [${code}] to:`);
    console.log(`Recipient: ${name} <${email}>`);
    console.log(`Expiration: 15 minutes`);
    console.log(`======================================================\n`);
    return true;
  }

  const payload = {
    sender: {
      name: "Sampark Messenger",
      email: senderEmail
    },
    to: [
      {
        email: email,
        name: name
      }
    ],
    subject: "Verify Your Email - Sampark Messenger",
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Email Verification</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 40px 20px; margin: 0;">
        <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 32px; shadow: 0 10px 30px rgba(0,0,0,0.01);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-flex; height: 48px; width: 48px; border-radius: 12px; background-color: #4f46e5; align-items: center; justify-content: center; color: #ffffff; font-size: 20px; font-weight: bold;">
              S
            </div>
            <h2 style="color: #0f172a; margin-top: 16px; font-size: 20px; font-weight: 800; tracking: -0.025em;">Verify Your Email</h2>
            <p style="color: #64748b; font-size: 13px; margin-top: 6px;">Thank you for signing up for Sampark Messenger.</p>
          </div>

          <div style="margin: 24px 0;">
            <p style="color: #334155; font-size: 13px; font-weight: 550; text-align: center; text-transform: uppercase; letter-spacing: 0.05em;">Enter 6-digit confirmation code</p>
            <div style="background-color: #0f172a; border-radius: 16px; padding: 16px; text-align: center; font-family: monospace; font-size: 28px; font-weight: 800; letter-spacing: 0.25em; color: #ffffff; margin: 12px 0;">
              ${code}
            </div>
            <p style="color: #64748b; font-size: 12px; line-height: 1.5; text-align: center; margin-top: 12px;">
              This confirmation code is valid for <strong>15 minutes</strong>. If you didn't request this email, you can safely disregard it.
            </p>
          </div>

          <div style="border-t: 1px solid #f1f5f9; padding-top: 24px; text-align: center; font-size: 11px; color: #94a3b8;">
            Version 2.4.0 (Build 992) <br />
            © 2026 SAMPARK Messenger. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        "accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      console.log(`[Brevo Email Service] Verification code successfully sent to ${email}`);
      return true;
    } else {
      const errorText = await res.text();
      console.error(`[Brevo Email Service] Sending failed:`, errorText);
      return false;
    }
  } catch (error) {
    console.error(`[Brevo Email Service] Fetch error:`, error);
    return false;
  }
};
