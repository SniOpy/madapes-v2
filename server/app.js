import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import path from "node:path";
import contactRouter from "./routes/contact.routes.js";

const app = express();
const projectRootDir = process.cwd();

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const matchesAllowedOrigin = (requestOrigin, allowedOriginRule) => {
  if (allowedOriginRule === requestOrigin) {
    return true;
  }

  if (!allowedOriginRule.includes("*")) {
    return false;
  }

  const wildcardRegex = new RegExp(`^${escapeRegex(allowedOriginRule).replace(/\\\*/g, ".*")}$`);
  return wildcardRegex.test(requestOrigin);
};

const corsOptions = {
  origin: (requestOrigin, callback) => {
    if (!requestOrigin) {
      return callback(null, true);
    }

    const isAllowedOrigin =
      allowedOrigins.length === 0 ||
      allowedOrigins.some((allowedOriginRule) =>
        matchesAllowedOrigin(requestOrigin, allowedOriginRule),
      );

    if (isAllowedOrigin) {
      return callback(null, true);
    }

    return callback(new Error("Origin not allowed by CORS"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  optionsSuccessStatus: 204,
};

app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: [
          "'self'",
          "https://unpkg.com",
          "https://cdn.jsdelivr.net",
        ],
        frameSrc: ["'self'"],
        styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
  }),
);
app.use(cors(corsOptions));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

app.get("/favicon.ico", (_req, res) => {
  return res.status(204).end();
});



app.get("/api/health", (_req, res) => {
  return res.status(200).json({ success: true, message: "API is running." });
});

app.use("/api/contact", contactRouter);

app.get("/", (_req, res) => {
  return res.sendFile(path.join(projectRootDir, "index.html"));
});
app.use(express.static(projectRootDir, { index: false }));

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
