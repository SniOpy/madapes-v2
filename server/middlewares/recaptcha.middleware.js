import axios from "axios";

const GOOGLE_RECAPTCHA_VERIFY_URL =
  "https://www.google.com/recaptcha/api/siteverify";
const MINIMUM_RECAPTCHA_SCORE = 0.5;

export const verifyRecaptchaToken = async (req, res, next) => {
  try {
    const recaptchaToken = req.body?.recaptchaToken;

    if (!recaptchaToken) {
      return res.status(403).json({
        success: false,
        message: "Verification anti-spam invalide.",
      });
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
