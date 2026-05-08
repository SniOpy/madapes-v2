import { getMailTransporter } from "../config/mail.config.js";

const DEFAULT_ADMIN_EMAIL = "madapes.agency@gmail.com";
const DEFAULT_MAIL_SEND_TIMEOUT_MS = 12000;

const resolveSenderEmail = () => process.env.MAIL_USER || DEFAULT_ADMIN_EMAIL;
const resolveMailSendTimeout = () => {
  const timeoutMs = Number(process.env.MAIL_SEND_TIMEOUT_MS);
  return Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_MAIL_SEND_TIMEOUT_MS;
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

export const sendAdminNotificationEmail = async (mailOptions) => {
  return sendMailWithTimeout(
    {
    from: resolveSenderEmail(),
    to: DEFAULT_ADMIN_EMAIL,
      ...mailOptions,
    },
    "Admin email",
  );
};

export const sendClientConfirmationEmail = async (mailOptions) => {
  return sendMailWithTimeout(
    {
    from: resolveSenderEmail(),
      ...mailOptions,
    },
    "Client confirmation email",
  );
};
