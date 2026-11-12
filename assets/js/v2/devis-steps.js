/* Madapes V2 — habillage en 3 étapes du formulaire de devis EXISTANT.
   Ne remplace PAS assets/js/devis.js : c'est toujours lui qui valide et envoie la demande à /api.
   Ce fichier gère seulement : les étapes, le récapitulatif, et le pré-remplissage depuis le Lab
   (/devis?module=smart-fleet&missions=filter,inspect). */
"use strict";

(function () {
  const form = document.querySelector(".devis-form");
  if (!form) return;
  const { $, $$ } = window.MadapesV2;

  const panels = $$(".v2-step-panel", form);
  const bars = $$(".v2-progress > div");
  const prev = $("#v2-prev"), next = $("#v2-next"), submit = form.querySelector('button[type="submit"]');
  let step = 0;

  const show = (i) => {
    step = i;
    panels.forEach((p, j) => (p.hidden = j !== i));
    bars.forEach((b, j) => { b.classList.toggle("is-on", j <= i); b.classList.toggle("is-current", j === i); });
    prev.hidden = i === 0;
    next.hidden = i === panels.length - 1;
    submit.hidden = i !== panels.length - 1;
    const first = panels[i].querySelector("input:not([type=radio]):not([tabindex='-1']), select, textarea");
    if (first && i > 0) first.focus({ preventScroll: true });
  };

  /* Champs obligatoires de l'étape en cours : même règle que devis.js (non vide, email valide, 20 caractères min.) */
  const stepValid = () => {
    let ok = true;
    $$("[required]", panels[step]).forEach((f) => {
      const v = f.value.trim();
      let bad = v.length === 0;
      if (!bad && f.type === "email") bad = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      if (!bad && f.name === "project_details") bad = v.length < 20;
      f.classList.toggle("is-invalid", bad);
      if (bad && ok) { f.focus(); ok = false; }
    });
    return ok;
  };

  next.addEventListener("click", () => { if (stepValid()) show(Math.min(step + 1, panels.length - 1)); });
  prev.addEventListener("click", () => show(Math.max(step - 1, 0)));

  /* Récapitulatif à droite */
  const label = (name) => {
    const el = form.querySelector(`[name="${name}"]:checked`) || form.querySelector(`select[name="${name}"]`);
    if (!el) return "—";
    if (el.tagName === "SELECT") return el.value ? el.options[el.selectedIndex].text : "—";
    return el.closest("label")?.querySelector("strong")?.textContent || el.value;
  };
  const recap = () => {
    $("#v2-r-service").textContent = label("service");
    $("#v2-r-goal").textContent = label("goal");
    $("#v2-r-budget").textContent = label("budget");
    $("#v2-r-start").textContent = label("start_timing");
  };
  form.addEventListener("change", recap);

  /* Pré-remplissage depuis le Lab */
  const DEMOS = { "smart-fleet": "Smart Fleet (gestion de flotte)", dashboard: "Executive Dashboard", "blog-seo": "Blog & SEO admin", "ai-workflow": "AI Workflow (automatisation)", configurateur: "Configurateur produit", lab: "Le Lab" };
  const MISSIONS = { filter: "filtrer", inspect: "suivre un véhicule", alert: "déclencher une alerte", period: "changer la période", metric: "basculer de métrique", compare: "comparer", open: "ouvrir un article", score: "atteindre 80/100", publish: "publier", toggle: "couper un bloc", run: "lancer le flux", lead: "tester l'autre lead", color: "couleur", mat: "matière", engrave: "gravure" };
  const q = new URLSearchParams(location.search);
  const mod = q.get("module");
  if (mod && DEMOS[mod]) {
    const done = (q.get("missions") || "").split(",").filter((m) => MISSIONS[m]);
    const custom = form.querySelector('input[name="service"][value="projet-sur-mesure"]');
    if (custom) { custom.checked = true; custom.dispatchEvent(new Event("change", { bubbles: true })); }
    const ta = form.querySelector('textarea[name="project_details"]');
    if (ta && !ta.value) ta.value = `Démo testée sur le Lab : ${DEMOS[mod]}${done.length ? ` (${done.map((m) => MISSIONS[m]).join(", ")})` : ""}.\n\nMon besoin : `;
    const box = $("#v2-lab-recap");
    if (box) {
      box.hidden = false;
      $("#v2-r-demo").textContent = DEMOS[mod];
      $("#v2-r-missions").textContent = `${done.length}/3`;
    }
  }

  /* Si devis.js refuse l'envoi à cause d'un champ d'une étape précédente, on rouvre cette étape */
  form.addEventListener("submit", () => {
    for (let i = 0; i < panels.length; i++) {
      const bad = $$("[required]", panels[i]).some((f) => !f.value.trim());
      if (bad) { show(i); break; }
    }
  }, true);

  recap();
  show(0);
})();
