/* Madapes V2 — utilitaires partagés (accueil + Lab).
   Fichier externe obligatoire : la CSP du site interdit les scripts inline. */
"use strict";

window.MadapesV2 = (function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** Échappe le texte avant insertion HTML (indispensable pour les saisies utilisateur). */
  const esc = (v) =>
    String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const pad2 = (n) => String(n).padStart(2, "0");

  /** Envoie un événement GTM (déjà installé sur le site). */
  const track = (event, params = {}) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...params });
  };

  /**
   * Missions du Lab : pastilles « ○ / ✓ » dans [data-missions].
   * Usage : const m = MadapesV2.missions("smart-fleet", ["filter","inspect","alert"]); m.done("filter");
   */
  const missions = (moduleId, ids) => {
    const state = Object.fromEntries(ids.map((id) => [id, false]));
    const paint = () => {
      $$("[data-mission]").forEach((el) => {
        const ok = state[el.dataset.mission];
        el.classList.toggle("is-done", ok);
        const mark = el.querySelector("[data-mark]");
        if (mark) mark.textContent = ok ? "✓" : "○";
      });
      const count = Object.values(state).filter(Boolean).length;
      $$("[data-missions-count]").forEach((el) => (el.textContent = `${count}/${ids.length}`));
      $$("[data-cta-devis]").forEach((a) => {
        const done = ids.filter((id) => state[id]).join(",");
        a.href = `/devis?module=${encodeURIComponent(moduleId)}${done ? `&missions=${encodeURIComponent(done)}` : ""}`;
      });
    };
    paint();
    return {
      done(id) {
        if (!(id in state) || state[id]) return;
        state[id] = true;
        track("lab_mission_complete", { module: moduleId, mission_id: id });
        paint();
      },
      count: () => Object.values(state).filter(Boolean).length,
    };
  };

  /** Suivi des clics sur les CTA du Lab. */
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-cta-devis]");
    if (a) track("lab_cta_click", { module: a.dataset.ctaDevis || "lab" });
  });

  return { esc, $, $$, pad2, track, missions, reduceMotion };
})();
