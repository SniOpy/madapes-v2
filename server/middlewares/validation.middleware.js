import { body, matchedData, validationResult } from "express-validator";

const normalizeText = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const sanitizeOptionalTextField = (fieldName, maxLength = 1000) =>
  body(fieldName)
    .optional({ values: "falsy" })
    .isString()
    .withMessage(`${fieldName} invalide.`)
    .customSanitizer(normalizeText)
    .isLength({ max: maxLength })
    .withMessage(`${fieldName} est trop long.`);

export const validateContactForm = [
  body("fullName")
    .exists({ values: "falsy" })
    .withMessage("Le nom complet est obligatoire.")
    .bail()
    .isString()
    .withMessage("Le nom complet est invalide.")
    .customSanitizer(normalizeText)
    .isLength({ min: 2, max: 120 })
    .withMessage("Le nom complet doit contenir entre 2 et 120 caracteres."),

  body("email")
    .exists({ values: "falsy" })
    .withMessage("L'email est obligatoire.")
    .bail()
    .customSanitizer((value) => normalizeText(value).toLowerCase())
    .isEmail()
    .withMessage("L'email est invalide.")
    .normalizeEmail(),

  body("serviceType")
    .exists({ values: "falsy" })
    .withMessage("La prestation est obligatoire.")
    .bail()
    .isString()
    .withMessage("La prestation est invalide.")
    .customSanitizer(normalizeText)
    .isLength({ min: 2, max: 120 })
    .withMessage("La prestation est invalide."),

  body("projectDescription")
    .exists({ values: "falsy" })
    .withMessage("La description du projet est obligatoire.")
    .bail()
    .isString()
    .withMessage("La description du projet est invalide.")
    .customSanitizer(normalizeText)
    .isLength({ min: 20, max: 5000 })
    .withMessage("La description du projet doit contenir au moins 20 caracteres."),

  body("phone")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("phone invalide.")
    .customSanitizer(normalizeText)
    .isLength({ max: 40 })
    .withMessage("phone est trop long.")
    .matches(/^[+\d().\s-]{6,40}$/)
    .withMessage("Le numero de telephone est invalide."),

  sanitizeOptionalTextField("companyName", 120),
  sanitizeOptionalTextField("budget", 80),
  sanitizeOptionalTextField("projectGoal", 500),
  sanitizeOptionalTextField("startDelay", 120),

  body("website")
    .optional({ values: "falsy" })
    .customSanitizer(normalizeText)
    .isURL({
      protocols: ["http", "https"],
      require_protocol: true,
      allow_protocol_relative_urls: false,
      disallow_auth: true,
    })
    .withMessage("Le site web doit etre une URL valide.")
    .isLength({ max: 300 })
    .withMessage("Le site web est trop long."),

  (req, res, next) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      req.validatedContactData = matchedData(req, {
        locations: ["body"],
        includeOptionals: true,
      });
      return next();
    }

    return res.status(422).json({
      success: false,
      message: "Les informations du formulaire sont invalides.",
      errors: errors.array({ onlyFirstError: true }),
    });
  },
];
