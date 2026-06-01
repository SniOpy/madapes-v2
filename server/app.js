import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import path from "node:path";
import contactRouter from "./routes/contact.routes.js";

const app = express();
const projectRootDir = process.cwd();
app.set("trust proxy", 1);

const SLUG_ROUTES = {
  "/services": "/pages/services.html",
  "/tracking": "/pages/tracking.html",
  "/offres": "/pages/offres.html",
  "/starter": "/pages/starter.html",
  "/growth": "/pages/growth.html",
  "/performance": "/pages/performance.html",
  "/blog": "/pages/blog.html",
  "/realisations": "/pages/realisations.html",
  "/google-ads": "/pages/google-ads.html",
  "/landing-pages": "/pages/landing-pages.html",
  "/seo": "/pages/seo.html",
  "/contact": "/pages/contact.html",
  "/devis": "/pages/devis.html",
  "/plan-du-site": "/pages/plan-du-site.html",
  "/conditions-generales-de-service": "/pages/conditions-generales-de-service.html",
  "/mentions-legales": "/pages/mentions-legales.html",
  "/politique-confidentialite": "/pages/politique-confidentialite.html",
  "/gestion-cookies": "/pages/gestion-cookies.html",
};

const LEGACY_ROUTES = {
  "/pages/services.html": "/services",
  "/pages/tracking.html": "/tracking",
  "/pages/offres.html": "/offres",
  "/pages/starter.html": "/starter",
  "/pages/growth.html": "/growth",
  "/pages/performance.html": "/performance",
  "/pages/blog.html": "/blog",
  "/pages/realisations.html": "/realisations",
  "/pages/google-ads.html": "/google-ads",
  "/pages/landing-pages.html": "/landing-pages",
  "/pages/seo.html": "/seo",
  "/pages/contact.html": "/contact",
  "/pages/devis.html": "/devis",
  "/pages/plan-du-site.html": "/plan-du-site",
  "/pages/cgs.html": "/conditions-generales-de-service",
  "/pages/conditions-generales-de-service.html": "/conditions-generales-de-service",
  "/pages/mentions-legales.html": "/mentions-legales",
  "/pages/politique-confidentialite.html": "/politique-confidentialite",
  "/pages/gestion-cookies.html": "/gestion-cookies",
};

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
          "https://www.googletagmanager.com",
          "https://*.googletagmanager.com",
          "https://www.google-analytics.com",
          "https://*.google-analytics.com",
          "https://www.googleadservices.com",
          "https://googleads.g.doubleclick.net",
          "https://www.google.com",
          "https://*.clarity.ms",
          "https://www.clarity.ms",
          "https://unpkg.com",
          "https://cdn.jsdelivr.net",
          "https://assets.calendly.com",
        ],
        frameSrc: [
          "'self'",
          "https://www.googletagmanager.com",
          "https://td.doubleclick.net",
          "https://*.doubleclick.net",
          "https://www.google.com",
          "https://*.google.com",
          "https://calendly.com",
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://assets.calendly.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: [
          "'self'",
          "https://www.google-analytics.com",
          "https://*.google-analytics.com",
          "https://analytics.google.com",
          "https://*.analytics.google.com",
          "https://www.googletagmanager.com",
          "https://region1.google-analytics.com",
          "https://googleads.g.doubleclick.net",
          "https://*.g.doubleclick.net",
          "https://www.googleadservices.com",
          "https://www.google.com",
          "https://*.google.com",
          "https://pagead2.googlesyndication.com",
          "https://*.clarity.ms",
          "https://c.bing.com",
          "https://calendly.com",
          "https://assets.calendly.com",
        ],
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

for (const [legacyPath, slugPath] of Object.entries(LEGACY_ROUTES)) {
  app.get(legacyPath, (req, res) => {
    const targetPath = `${slugPath}${req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""}`;
    return res.redirect(301, targetPath);
  });
}

// Ancienne URL /cgs -> nouvelle URL propre (SEO 301)
app.get("/cgs", (_req, res) => {
  return res.redirect(301, "/conditions-generales-de-service");
});

for (const [slugPath, htmlPath] of Object.entries(SLUG_ROUTES)) {
  app.get(slugPath, (_req, res) => {
    return res.sendFile(path.join(projectRootDir, htmlPath));
  });
}

app.use(express.static(projectRootDir, { index: false }));

app.use((err, _req, res, _next) => {
  console.error("Unhandled API error");
  console.error({
    message: err?.message,
    code: err?.code,
    name: err?.name,
  });

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
