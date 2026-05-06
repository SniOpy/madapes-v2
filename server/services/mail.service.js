import { getMailTransporter } from "../config/mail.config.js";

const DEFAULT_ADMIN_EMAIL = "madapes.agency@gmail.com";

const resolveSenderEmail = () => process.env.MAIL_USER || DEFAULT_ADMIN_EMAIL;

export const sendAdminNotificationEmail = async (mailOptions) => {
  const transporter = getMailTransporter();

  return transporter.sendMail({
    from: resolveSenderEmail(),
    to: DEFAULT_ADMIN_EMAIL,
    ...mailOptions,
  });
};

export const sendClientConfirmationEmail = async (mailOptions) => {
  const transporter = getMailTransporter();

  return transporter.sendMail({
    from: resolveSenderEmail(),
    ...mailOptions,
  });
};
