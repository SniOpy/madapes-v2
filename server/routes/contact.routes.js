import { Router } from "express";
import { handleContactFormSubmission } from "../controllers/contact.controller.js";
import { contactRateLimiter } from "../middlewares/rateLimit.middleware.js";
import { validateContactForm } from "../middlewares/validation.middleware.js";

const contactRouter = Router();

contactRouter.post(
  "/",
  contactRateLimiter,
  validateContactForm,
  handleContactFormSubmission,
);

export default contactRouter;
