import { Router } from "express";
import { handleContactFormSubmission } from "../controllers/contact.controller.js";
import { contactRateLimiter } from "../middlewares/rateLimit.middleware.js";
import { validateContactForm } from "../middlewares/validation.middleware.js";
import { verifyRecaptchaToken } from "../middlewares/recaptcha.middleware.js";

const contactRouter = Router();

contactRouter.post(
  "/",
  contactRateLimiter,
  validateContactForm,
  verifyRecaptchaToken,
  handleContactFormSubmission,
);

export default contactRouter;
