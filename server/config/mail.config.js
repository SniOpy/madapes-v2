import nodemailer from "nodemailer";

let cachedTransporter = null;

const DEFAULT_MAIL_HOST = "smtp.gmail.com";
const DEFAULT_MAIL_PORT = 587;
const DEFAULT_MAIL_SECURE = false;
const DEFAULT_CONNECTION_TIMEOUT_MS = 10000;
const DEFAULT_GREETING_TIMEOUT_MS = 10000;
const DEFAULT_SOCKET_TIMEOUT_MS = 15000;

const parsePositiveNumber = (value, fallback) => {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
};

const parseBoolean = (value, fallback) => {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalizedValue = value.trim().toLowerCase();
  if (normalizedValue === "true" || normalizedValue === "1") {
    return true;
  }
  if (normalizedValue === "false" || normalizedValue === "0") {
    return false;
  }

  return fallback;
};

const ensureMailEnvironment = () => {
  const mailUser = String(process.env.MAIL_USER ?? "").trim();
  const mailPassword = String(process.env.MAIL_PASSWORD ?? "").trim();

  console.log({
    MAIL_USER_EXISTS: !!mailUser,
    MAIL_PASSWORD_EXISTS: !!mailPassword,
  });

  if (!mailUser || !mailPassword) {
    throw new Error(
      "Missing mail configuration. MAIL_USER and MAIL_PASSWORD are required.",
    );
  }

  return {
    mailUser,
    mailPassword,
  };
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

  const socketTimeout = parsePositiveNumber(
    process.env.MAIL_SOCKET_TIMEOUT_MS,
    DEFAULT_SOCKET_TIMEOUT_MS,
  );

  const host = String(process.env.MAIL_HOST || DEFAULT_MAIL_HOST).trim();
  const port = parsePositiveNumber(process.env.MAIL_PORT, DEFAULT_MAIL_PORT);
  const secure = parseBoolean(process.env.MAIL_SECURE, DEFAULT_MAIL_SECURE);

  console.log({
    MAIL_HOST: host,
    MAIL_PORT: port,
    MAIL_SECURE: secure,
  });

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure,

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
  try {
    const transporter = getMailTransporter();

    await transporter.verify();

    console.log("✅ Mail server is ready");
  } catch (error) {
    console.error("❌ Mail server verification failed");
    console.error(error);

    throw error;
  }
};