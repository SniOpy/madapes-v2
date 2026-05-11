const renderBase = (process.env.RENDER_API_ORIGIN || "").replace(/\/+$/, "");

/** Same slugs as `server.mjs` → real files under `pages/`. */
const slugRewrites = [
  ["/services", "/pages/services.html"],
  ["/tracking", "/pages/tracking.html"],
  ["/offres", "/pages/offres.html"],
  ["/blog", "/pages/blog.html"],
  ["/realisations", "/pages/realisations.html"],
  ["/google-ads", "/pages/google-ads.html"],
  ["/landing-pages", "/pages/landing-pages.html"],
  ["/seo", "/pages/seo.html"],
  ["/contact", "/pages/contact.html"],
  ["/devis", "/pages/devis.html"],
  ["/plan-du-site", "/pages/plan-du-site.html"],
  ["/cgs", "/pages/cgs.html"],
  ["/mentions-legales", "/pages/mentions-legales.html"],
  ["/politique-confidentialite", "/pages/politique-confidentialite.html"],
  ["/gestion-cookies", "/pages/gestion-cookies.html"],
].map(([source, destination]) => ({ source, destination }));

export const config = {
  version: 2,
  cleanUrls: true,
  trailingSlash: false,
  rewrites: [
    ...(renderBase
      ? [{ source: "/api/:path*", destination: `${renderBase}/api/:path*` }]
      : []),
    ...slugRewrites,
    { source: "/(.*)", destination: "/index.html" },
  ],
};
