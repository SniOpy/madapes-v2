import { body, validationResult } from "express-validator";

const sanitizeOptionalTextField = (fieldName, maxLength = 1000) =>
  body(fieldName)
    .optional({ values: "falsy" })
    .isString()
    .withMessage(`${fieldName} invalide.`)
    .trim()
    .isLength({ max: maxLength })
    .withMessage(`${fieldName} est trop long.`)
    .escape();

export const validateContactForm = [
  body("fullName")
    .exists({ values: "falsy" })
    .withMessage("Le nom complet est obligatoire.")
    .bail()
    .isString()
    .withMessage("Le nom complet est invalide.")
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Le nom complet doit contenir entre 2 et 120 caracteres.")
    .escape(),

  body("email")
    .exists({ values: "falsy" })
    .withMessage("L'email est obligatoire.")
    .bail()
    .isEmail()
    .withMessage("L'email est invalide.")
    .normalizeEmail(),

  body("serviceType")
    .exists({ values: "falsy" })
    .withMessage("La prestation est obligatoire.")
    .bail()
    .isString()
    .withMessage("La prestation est invalide.")
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("La prestation est invalide.")
    .escape(),

  body("projectDescription")
    .exists({ values: "falsy" })
    .withMessage("La description du projet est obligatoire.")
    .bail()
    .isString()
    .withMessage("La description du projet est invalide.")
    .trim()
    .isLength({ min: 20, max: 5000 })
    .withMessage("La description du projet doit contenir au moins 20 caracteres.")
    .escape(),

  body("recaptchaToken")
    .exists({ values: "falsy" })
    .withMessage("Le token reCAPTCHA est obligatoire.")
    .bail()
    .isString()
    .withMessage("Le token reCAPTCHA est invalide.")
    .trim(),

  sanitizeOptionalTextField("phone", 40),
  sanitizeOptionalTextField("companyName", 120),
  sanitizeOptionalTextField("budget", 80),
  sanitizeOptionalTextField("projectGoal", 500),
  sanitizeOptionalTextField("startDelay", 120),

  body("website")
    .optional({ values: "falsy" })
    .isURL({
      protocols: ["http", "https"],
      require_protocol: true,
    })
    .withMessage("Le site web doit etre une URL valide.")
    .trim()
    .isLength({ max: 300 })
    .withMessage("Le site web est trop long.")
    .escape(),

  (req, res, next) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      return next();
    }

    return res.status(422).json({
      success: false,
      message: "Les informations du formulaire sont invalides.",
      errors: errors.array({ onlyFirstError: true }),
    });
  },
];
