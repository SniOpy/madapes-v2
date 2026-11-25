/* Madapes V2 — pré-initialisation du mouvement (chargé de façon bloquante dans <head>).
   - .v2-motion : masque le hero AVANT le premier rendu (pas de flash) si les animations sont acceptées.
   - .v2-preload : écran noir du preloader, uniquement à la 1re visite de la session.
   Filet de sécurité : si motion.js (ou GSAP via CDN) ne démarre pas en 3,5 s, on retire
   les deux classes et tout reste visible. */
"use strict";

(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var root = document.documentElement;
  root.classList.add("v2-motion");
  try {
    if (!sessionStorage.getItem("v2-loaded")) root.classList.add("v2-preload");
  } catch (e) { /* stockage indisponible : pas de preloader */ }
  window.setTimeout(function () {
    if (!root.classList.contains("v2-motion-ready")) root.classList.remove("v2-motion", "v2-preload");
  }, 3500);
})();
