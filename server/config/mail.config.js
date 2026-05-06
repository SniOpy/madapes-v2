import nodemailer from "nodemailer";

let cachedTransporter = null;

const ensureMailEnvironment = () => {
  const mailUser = process.env.MAIL_USER;
  const mailPassword = process.env.MAIL_PASSWORD;

  if (!mailUser || !mailPassword) {
    throw new Error("Missing mail configuration. MAIL_USER and MAIL_PASSWORD are required.");
  }

  return { mailUser, mailPassword };
};

export const getMailTransporter = () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const { mailUser, mailPassword } = ensureMailEnvironment();

  cachedTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: mailUser,
      pass: mailPassword,
    },
  });

  return cachedTransporter;
};

export const verifyMailTransporter = async () => {
  const transporter = getMailTransporter();
  await transporter.verify();
};
