import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import contactRouter from "./routes/contact.routes.js";

const app = express();

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (requestOrigin, callback) => {
    if (!requestOrigin) {
      return callback(null, true);
    }

    if (allowedOrigins.length === 0 || allowedOrigins.includes(requestOrigin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin not allowed by CORS"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  optionsSuccessStatus: 204,
};

app.disable("x-powered-by");
app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

app.get("/api/health", (_req, res) => {
  return res.status(200).json({ success: true, message: "API is running." });
});

app.get("/api/public-config", (_req, res) => {
  return res.status(200).json({
    recaptchaSiteKey: String(process.env.VITE_RECAPTCHA_SITE_KEY || "").trim(),
  });
});

app.use("/api/contact", contactRouter);

app.use((err, _req, res, _next) => {
  if (err?.message === "Origin not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "Acces refuse.",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Une erreur est survenue. Merci de reessayer.",
  });
});

export default app;
