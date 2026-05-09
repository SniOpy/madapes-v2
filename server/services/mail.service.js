import { getMailTransporter } from "../config/mail.config.js";

const DEFAULT_ADMIN_EMAIL = "madapes.agency@gmail.com";
const DEFAULT_MAIL_SEND_TIMEOUT_MS = 12000;
const RESEND_API_ENDPOINT = "https://api.resend.com/emails";

const resolveSenderEmail = () => process.env.MAIL_USER || DEFAULT_ADMIN_EMAIL;
const resolveResendApiKey = () => String(process.env.RESEND_API_KEY || "").trim();
const resolveResendFromEmail = () =>
  String(process.env.RESEND_FROM_EMAIL || resolveSenderEmail()).trim();
const resolveMailSendTimeout = () => {
  const timeoutMs = Number(process.env.MAIL_SEND_TIMEOUT_MS);
  return Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_MAIL_SEND_TIMEOUT_MS;
};

const shouldUseResendFallback = (error) => {
  const errorCode = String(error?.code || "").toUpperCase();
  const errorMessage = String(error?.message || "").toLowerCase();

  return (
    errorCode.includes("TIMEOUT") ||
    errorCode === "ESOCKET" ||
    errorCode === "ECONNECTION" ||
    errorMessage.includes("timeout") ||
    errorMessage.includes("connection")
  );
};

const sendViaResend = async (mailOptions) => {
  const apiKey = resolveResendApiKey();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is missing and SMTP delivery failed.");
  }

  const response = await fetch(RESEND_API_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resolveResendFromEmail(),
      to: [mailOptions.to],
      subject: mailOptions.subject,
      html: mailOptions.html,
      reply_to: mailOptions.replyTo,
    }),
  });

  if (!response.ok) {
    const responseBody = await response.text().catch(() => "");
    throw new Error(`Resend send failed: ${response.status} ${responseBody}`);
  }
};

const sendMailWithTimeout = async (mailOptions, timeoutLabel) => {
  const transporter = getMailTransporter();
  const timeoutMs = resolveMailSendTimeout();

  return Promise.race([
    transporter.sendMail(mailOptions),
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${timeoutLabel} timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    }),
  ]);
};

const sendTransactionalEmail = async (mailOptions, timeoutLabel) => {
  try {
    return await sendMailWithTimeout(mailOptions, timeoutLabel);
  } catch (error) {
    if (!shouldUseResendFallback(error)) {
      throw error;
    }

    console.error(`${timeoutLabel} SMTP failed, trying Resend fallback`);
    return sendViaResend(mailOptions);
  }
};

export const sendAdminNotificationEmail = async (mailOptions) => {
  return sendTransactionalEmail(
    {
      from: resolveSenderEmail(),
      to: DEFAULT_ADMIN_EMAIL,
      ...mailOptions,
    },
    "Admin email",
  );
};

export const sendClientConfirmationEmail = async (mailOptions) => {
  return sendTransactionalEmail(
    {
      from: resolveSenderEmail(),
      ...mailOptions,
    },
    "Client confirmation email",
  );
};
