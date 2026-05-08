import nodemailer from "nodemailer";

let cachedTransporter = null;
const DEFAULT_CONNECTION_TIMEOUT_MS = 10000;
const DEFAULT_GREETING_TIMEOUT_MS = 10000;
const DEFAULT_SOCKET_TIMEOUT_MS = 15000;

const parsePositiveNumber = (value, fallback) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
};

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
  const connectionTimeout = parsePositiveNumber(
    process.env.MAIL_CONNECTION_TIMEOUT_MS,
    DEFAULT_CONNECTION_TIMEOUT_MS,
  );
  const greetingTimeout = parsePositiveNumber(
    process.env.MAIL_GREETING_TIMEOUT_MS,
    DEFAULT_GREETING_TIMEOUT_MS,
  );
  const socketTimeout = parsePositiveNumber(process.env.MAIL_SOCKET_TIMEOUT_MS, DEFAULT_SOCKET_TIMEOUT_MS);

  cachedTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: mailUser,
      pass: mailPassword,
    },
    connectionTimeout,
    greetingTimeout,
    socketTimeout,
  });

  return cachedTransporter;
};

export const verifyMailTransporter = async () => {
  const transporter = getMailTransporter();
  await transporter.verify();
};
