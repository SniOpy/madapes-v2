import axios from "axios";

const GOOGLE_RECAPTCHA_VERIFY_URL =
  "https://www.google.com/recaptcha/api/siteverify";
const MINIMUM_RECAPTCHA_SCORE = 0.5;
const DEV_BYPASS_TOKEN = "local-dev-bypass";
const LOCAL_HOST_VALUES = ["localhost", "127.0.0.1"];

const isLocalRequest = (req) => {
  const origin = String(req.headers.origin || "");
  const referer = String(req.headers.referer || "");
  const host = String(req.headers.host || "");
  const forwardedHost = String(req.headers["x-forwarded-host"] || "");
  const remoteAddress = String(req.socket?.remoteAddress || "");

  const requestMetadata = [origin, referer, host, forwardedHost, remoteAddress].join(" ").toLowerCase();

  return LOCAL_HOST_VALUES.some((value) => requestMetadata.includes(value));
};

export const verifyRecaptchaToken = async (req, res, next) => {
  try {
    const recaptchaToken = req.body?.recaptchaToken;

    if (!recaptchaToken) {
      return res.status(403).json({
        success: false,
        message: "Verification anti-spam invalide.",
      });
    }

    const currentNodeEnv = String(process.env.NODE_ENV || "").toLowerCase();
    const isDevelopment = currentNodeEnv === "development";

    if (isDevelopment && (recaptchaToken === DEV_BYPASS_TOKEN || isLocalRequest(req))) {
      return next();
    }

    const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!recaptchaSecretKey) {
      return res.status(500).json({
        success: false,
        message: "Configuration serveur invalide.",
      });
    }

    const requestBody = new URLSearchParams({
      secret: recaptchaSecretKey,
      response: recaptchaToken,
    });

    const { data } = await axios.post(GOOGLE_RECAPTCHA_VERIFY_URL, requestBody, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 7000,
    });

    const isValidToken = data?.success === true;
    const hasValidScore = Number(data?.score) >= MINIMUM_RECAPTCHA_SCORE;

    if (!isValidToken || !hasValidScore) {
      return res.status(403).json({
        success: false,
        message: "Verification anti-spam invalide.",
      });
    }

    return next();
  } catch (_error) {
    return res.status(403).json({
      success: false,
      message: "Verification anti-spam invalide.",
    });
  }
};
