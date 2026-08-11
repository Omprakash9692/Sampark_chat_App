export const sendVerificationEmail = async (email, name, code) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "no-reply@sampark.com";

  if (!apiKey || apiKey === "your_brevo_api_key") {
    console.log(`\n[Brevo Mock Email Service] Sent code [${code}] to ${name} <${email}> (Expires: 15m)\n`);
    return true;
  }

  const htmlContent = `
    <div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:24px;padding:32px;font-family:sans-serif;">
      <div style="text-align:center;">
        <div style="display:inline-block;padding:12px 18px;border-radius:12px;background:#4f46e5;color:#fff;font-size:20px;font-weight:bold;">S</div>
        <h2 style="color:#0f172a;margin-top:16px;">Verify Your Email</h2>
        <p style="color:#64748b;font-size:13px;">Thank you for signing up for Sampark Messenger.</p>
        <div style="background:#0f172a;border-radius:16px;padding:16px;font-family:monospace;font-size:28px;font-weight:800;letter-spacing:0.25em;color:#fff;margin:20px 0;">${code}</div>
        <p style="color:#64748b;font-size:12px;">Valid for <strong>15 minutes</strong>.</p>
      </div>
      <div style="border-top:1px solid #f1f5f9;margin-top:24px;padding-top:16px;text-align:center;font-size:11px;color:#94a3b8;">© 2026 SAMPARK Messenger</div>
    </div>
  `;

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "content-type": "application/json", "accept": "application/json" },
      body: JSON.stringify({
        sender: { name: "Sampark Messenger", email: senderEmail },
        to: [{ email, name }],
        subject: "Verify Your Email - Sampark Messenger",
        htmlContent
      })
    });

    if (res.ok) {
      console.log(`[Brevo Email Service] Verification code sent to ${email}`);
      return true;
    }
    const err = await res.text();
    console.error(`[Brevo Email Service] Sending failed:`, err);
    return false;
  } catch (error) {
    console.error(`[Brevo Email Service] Fetch error:`, error);
    return false;
  }
};

