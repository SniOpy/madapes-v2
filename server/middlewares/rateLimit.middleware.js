import rateLimit from "express-rate-limit";

export const contactRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Trop de demandes envoyees. Merci de reessayer plus tard.",
  },
});
