import { createServer } from "node:http";
import { readFile, stat, mkdir, appendFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT_DIR = dirname(__filename);
const DATA_DIR = join(ROOT_DIR, "data");
const SUBMISSIONS_FILE = join(DATA_DIR, "submissions.log");

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || 3000);
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 12;
const MAX_JSON_BODY_BYTES = 32 * 1024;
const ALLOWED_METHODS = new Set(["GET", "HEAD", "POST"]);
const USE_RESEND = process.env.RESEND_API_KEY && process.env.FORM_FROM_EMAIL && process.env.FORM_TO_EMAIL;

// Slugs lisibles pour les visiteurs
const SLUG_ROUTES = {
  "/google-ads": "/pages/google-ads.html",
  "/landing-pages": "/pages/landing-pages.html",
  "/seo": "/pages/seo.html",
  "/contact": "/pages/contact.html",
  "/devis": "/pages/devis.html",
  "/plan-du-site": "/pages/plan-du-site.html",
  "/cgs": "/pages/cgs.html",
  "/mentions-legales": "/pages/mentions-legales.html",
  "/politique-confidentialite": "/pages/politique-confidentialite.html",
  "/gestion-cookies": "/pages/gestion-cookies.html",
};

// Anciennes URLs .html redirigées en 301 vers les slugs
const LEGACY_ROUTES = {
  "/pages/google-ads.html": "/google-ads",
  "/pages/landing-pages.html": "/landing-pages",
  "/pages/seo.html": "/seo",
  "/pages/contact.html": "/contact",
  "/pages/devis.html": "/devis",
  "/pages/plan-du-site.html": "/plan-du-site",
  "/pages/cgs.html": "/cgs",
  "/pages/mentions-legales.html": "/mentions-legales",
  "/pages/politique-confidentialite.html": "/politique-confidentialite",
  "/pages/gestion-cookies.html": "/gestion-cookies",
};

const resolveAbsolutePath = (relativePath) => {
  const cleanedPath = String(relativePath || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");

  return join(ROOT_DIR, cleanedPath);
};

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

const rateLimitStore = new Map();
const BLOCKED_PATHS = [
  /^\/server\.mjs$/i,
  /^\/package(?:-lock)?\.json$/i,
  /^\/\.env(?:\..*)?$/i,
  /^\/\.git(?:\/|$)/i,
  /^\/data(?:\/|$)/i,
  /^\/\.htaccess$/i,
  /^\/readme\.md$/i,
];

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "img-src 'self' data: https:",
  "script-src 'self' https://unpkg.com https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const applySecurityHeaders = (response) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  response.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  response.setHeader("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
};

const sanitizeText = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/[<>`"'\\]/g, "").trim();
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const now = () => Date.now();

const getClientIp = (request) => {
  const forwardedFor = request.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }

  return request.socket.remoteAddress || "unknown";
};

const checkRateLimit = (key) => {
  const currentTime = now();
  if (rateLimitStore.size > 1500) {
    for (const [entryKey, entryValue] of rateLimitStore.entries()) {
      if (currentTime - entryValue.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateLimitStore.delete(entryKey);
      }
    }
  }

  const entry = rateLimitStore.get(key);

  if (!entry || currentTime - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(key, { count: 1, windowStart: currentTime });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count += 1;
  return true;
};

const parseRequestJson = async (request) => {
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    totalBytes += chunk.length;
    if (totalBytes > MAX_JSON_BODY_BYTES) {
      const payloadError = new Error("Payload too large");
      payloadError.code = "PAYLOAD_TOO_LARGE";
      throw payloadError;
    }
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");

  if (!rawBody) {
    return {};
  }

  return JSON.parse(rawBody);
};

const sendJson = (response, statusCode, payload) => {
  applySecurityHeaders(response);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
};

const normalizePathname = (pathname) => {
  if (pathname.endsWith("/") && pathname.length > 1) {
    return pathname.slice(0, -1);
  }
  return pathname;
};

const getRequestedPath = (pathname) => {
  if (pathname === "/") {
    return "/index.html";
  }

  const slugTarget = SLUG_ROUTES[pathname];
  if (slugTarget) {
    return slugTarget;
  }

  // Permet /pages/nom-page sans ".html"
  if (pathname.startsWith("/pages/") && !extname(pathname)) {
    return `${pathname}.html`;
  }

  return pathname;
};

const sendNotFoundPage = async (response) => {
  try {
    const notFoundPage = await readFile(resolveAbsolutePath("404.html"), "utf8");
    applySecurityHeaders(response);
    response.writeHead(404, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    });
    response.end(notFoundPage);
  } catch {
    applySecurityHeaders(response);
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
    response.end("Not found");
  }
};

const isBlockedPath = (pathname) => BLOCKED_PATHS.some((pattern) => pattern.test(pathname));

const buildEmailBody = (title, payload) => {
  const rows = Object.entries(payload)
    .map(([key, value]) => `- ${key}: ${String(value || "")}`)
    .join("\n");

  return `${title}\n\n${rows}\n`;
};

const sendViaResend = async (subject, content) => {
  if (!USE_RESEND) {
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.FORM_FROM_EMAIL,
      to: [process.env.FORM_TO_EMAIL],
      subject,
      text: content,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend API error: ${response.status}`);
  }
};

const persistSubmission = async (type, payload, ip) => {
  await mkdir(DATA_DIR, { recursive: true });
  const row = JSON.stringify({
    type,
    ip,
    createdAt: new Date().toISOString(),
    payload,
  });
  await appendFile(SUBMISSIONS_FILE, `${row}\n`, "utf8");
};

const validateCommonPayload = (payload) => {
  const errors = [];
  const sanitizedPayload = {
    fullname: sanitizeText(payload.fullname),
    email: sanitizeText(payload.email).toLowerCase(),
    company: sanitizeText(payload.company),
    website: sanitizeText(payload.website),
    goal: sanitizeText(payload.goal),
    project_details: sanitizeText(payload.project_details),
    honeypot: sanitizeText(payload.contact_website),
  };

  if (!sanitizedPayload.fullname) {
    errors.push("Le nom est obligatoire.");
  }

  if (!EMAIL_PATTERN.test(sanitizedPayload.email)) {
    errors.push("L'email est invalide.");
  }

  if (!sanitizedPayload.goal) {
    errors.push("L'objectif principal est obligatoire.");
  }

  if (sanitizedPayload.project_details.length < 20) {
    errors.push("Le message doit contenir au moins 20 caractères.");
  }

  if (sanitizedPayload.honeypot.length > 0) {
    errors.push("Soumission détectée comme spam.");
  }

  return { errors, sanitizedPayload };
};

const validateDevisPayload = (payload) => {
  const { errors, sanitizedPayload } = validateCommonPayload(payload);
  const service = sanitizeText(payload.service);
  const budget = sanitizeText(payload.budget);
  const start_timing = sanitizeText(payload.start_timing);

  if (!service) {
    errors.push("Le type de prestation est obligatoire.");
  }

  return {
    errors,
    sanitizedPayload: {
      ...sanitizedPayload,
      service,
      budget,
      start_timing,
    },
  };
};

const handleFormSubmission = async (request, response, type) => {
  try {
    if (!String(request.headers["content-type"] || "").toLowerCase().includes("application/json")) {
      sendJson(response, 415, {
        success: false,
        message: "Format de requête invalide.",
      });
      return;
    }

    const ip = getClientIp(request);
    const rateLimitKey = `${type}:${ip}`;

    if (!checkRateLimit(rateLimitKey)) {
      sendJson(response, 429, {
        success: false,
        message: "Trop de tentatives. Réessayez dans quelques minutes.",
      });
      return;
    }

    const payload = await parseRequestJson(request);
    const validation = type === "devis" ? validateDevisPayload(payload) : validateCommonPayload(payload);

    if (validation.errors.length > 0) {
      sendJson(response, 400, {
        success: false,
        errors: validation.errors,
      });
      return;
    }

    const subject = `[Madapes] Nouveau formulaire ${type}`;
    const body = buildEmailBody(subject, validation.sanitizedPayload);

    await persistSubmission(type, validation.sanitizedPayload, ip);
    await sendViaResend(subject, body);

    sendJson(response, 200, {
      success: true,
      message: "Votre demande a bien été envoyée.",
    });
  } catch (error) {
    if (error?.code === "PAYLOAD_TOO_LARGE") {
      sendJson(response, 413, {
        success: false,
        message: "Le payload est trop volumineux.",
      });
      return;
    }

    if (error instanceof SyntaxError) {
      sendJson(response, 400, {
        success: false,
        message: "Le format JSON est invalide.",
      });
      return;
    }

    sendJson(response, 500, {
      success: false,
      message: "Une erreur est survenue. Merci de réessayer.",
    });
  }
};

const serveStaticFile = async (request, response) => {
  const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  const pathname = normalizePathname(requestUrl.pathname);
  const legacyTarget = LEGACY_ROUTES[pathname];

  if (legacyTarget) {
    const targetUrl = `${legacyTarget}${requestUrl.search}`;
    applySecurityHeaders(response);
    response.writeHead(301, { Location: targetUrl });
    response.end();
    return;
  }

  if (isBlockedPath(pathname)) {
    await sendNotFoundPage(response);
    return;
  }

  const requestedPath = getRequestedPath(pathname);
  const safePath = normalize(requestedPath).replace(/^(\.\.[\\/])+/, "");
  const absolutePath = resolveAbsolutePath(safePath);

  try {
    const fileStat = await stat(absolutePath);

    if (!fileStat.isFile()) {
      throw new Error("Not a file");
    }

    const extension = extname(absolutePath).toLowerCase();
    const contentType = MIME_TYPES[extension] || "application/octet-stream";

    applySecurityHeaders(response);
    response.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": extension === ".html" ? "no-cache" : "public, max-age=604800",
    });

    createReadStream(absolutePath).pipe(response);
  } catch {
    await sendNotFoundPage(response);
  }
};

const server = createServer(async (request, response) => {
  if (!ALLOWED_METHODS.has(request.method || "")) {
    applySecurityHeaders(response);
    response.writeHead(405, { "Content-Type": "text/plain; charset=utf-8", Allow: "GET, HEAD, POST" });
    response.end("Method Not Allowed");
    return;
  }

  if (request.method === "POST" && request.url === "/api/contact") {
    await handleFormSubmission(request, response, "contact");
    return;
  }

  if (request.method === "POST" && request.url === "/api/devis") {
    await handleFormSubmission(request, response, "devis");
    return;
  }

  await serveStaticFile(request, response);
});

server.listen(PORT, HOST, () => {
  console.log(`Madapes server running at http://${HOST}:${PORT}`);
});
