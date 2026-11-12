/* Madapes V2 — interactions de la page d'accueil */
"use strict";

(function () {
  const { $, $$, esc, pad2, reduceMotion } = window.MadapesV2;

  /* ---------- Console du hero (onglets) ---------- */
  const tabs = $$(".v2-console [role=tab]");
  tabs.forEach((tab) =>
    tab.addEventListener("click", () => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        $("#" + t.getAttribute("aria-controls")).hidden = !on;
      });
    })
  );

  /* Flux de conversions (onglet Tracking) */
  const feed = $("#v2-feed");
  const pool = [
    ["Demande de devis", "Google Ads", "#7C3AED"],
    ["Appel cliqué", "Landing page", "#A855F7"],
    ["Formulaire envoyé", "SEO", "#22C55E"],
    ["Prise de RDV", "Calendly", "#F59E0B"],
    ["Clic WhatsApp", "Mobile", "#7C3AED"],
  ];
  let tick = 0;
  const paintFeed = () => {
    if (!feed) return;
    feed.innerHTML = [0, 1, 2, 3]
      .map((i) => {
        const e = pool[(tick + i) % pool.length];
        const t = i === 0 ? "à l’instant" : `il y a ${i * 2} min`;
        return `<li><span class="v2-dot" style="background:${e[2]}"></span><b style="font-weight:500">${e[0]}</b><span class="v2-small">${e[1]}</span><span class="v2-small" style="margin-left:auto">${t}</span></li>`;
      })
      .join("");
  };
  paintFeed();
  if (!reduceMotion) setInterval(() => { tick++; paintFeed(); }, 1800);

  /* ---------- Méthode (stepper) ---------- */
  const steps = [
    ["Analyse", "On étudie votre activité, votre marché et vos objectifs pour construire la bonne stratégie."],
    ["Stratégie", "On définit un plan d'action sur-mesure orienté acquisition et performance."],
    ["Création", "On conçoit des supports rapides, modernes et pensés pour convertir."],
    ["Tracking & optimisation", "On implémente le tracking (GTM, GA4, Ads) et on optimise en continu."],
    ["Résultats", "Plus de visibilité, plus de demandes clients, et une activité qui progresse durablement."],
  ];
  const stepBtns = $$(".v2-step");
  const setStep = (i) => {
    stepBtns.forEach((b, j) => {
      b.setAttribute("aria-selected", String(i === j));
      b.classList.toggle("is-done", j <= i);
    });
    $(".v2-stepper__fill").style.width = `calc((100% - 44px) * ${i / 4})`;
    $("#v2-step-n").textContent = pad2(i + 1);
    $("#v2-step-title").textContent = steps[i][0];
    $("#v2-step-text").textContent = steps[i][1];
  };
  stepBtns.forEach((b, i) => b.addEventListener("click", () => setStep(i)));
  if (stepBtns.length) setStep(0);

  /* ---------- Réalisations (carrousel) ---------- */
  const projects = [
    { name: "Colourpig", tag: "Landing page · Shopify", img: "/assets/images/projects/hero-coloupig.png", url: "https://colourpig-preview.vercel.app/", text: "Intégration Shopify Hydrogen pour une boutique e-commerce monoproduit de coloration capillaire." },
    { name: "Debarenov", tag: "Site vitrine", img: "/assets/images/projects/debarenov.webp", url: "https://debarenov.fr", text: "Entreprise spécialisée dans le débarras après décès et succession immobilière." },
    { name: "O'Dog next door", tag: "Application", img: "/assets/images/projects/odog.png", url: "https://odog-next-door-3g90zfg8a-sniopys-projects.vercel.app/", text: "Application mobile pour trouver un petsitter à proximité de chez soi." },
    { name: "Galopin Automobile", tag: "Site vitrine", img: "/assets/images/projects/galopin.webp", url: "https://galopinautomobile.fr", text: "Vente de voiture automobile de luxe et de prestige." },
    { name: "Tadara", tag: "Landing page", img: "/assets/images/projects/tadara-picture.png", url: "https://tadara-landing-sniopy-sniopys-projects.vercel.app/", text: "Lettre mensuelle qui fait découvrir aux enfants l'héritage de la civilisation arabo-musulmane." },
    { name: "Sokhra", tag: "Application", img: "/assets/images/projects/sokhra-picture.png", url: "/realisations", text: "Application de réservation de livreur au Maroc." },
    { name: "Crazee Burger", tag: "Application", img: "/assets/images/projects/crazee-burger.webp", url: "https://crazee-burger-eta-nine.vercel.app", text: "Application mobile pour la livraison de burgers." },
  ];
  let p = 0;
  const ext = (u) => (u.startsWith("http") ? ' target="_blank" rel="noopener"' : "");
  const paintProj = () => {
    const main = $("#projects-list");
    if (!main) return;
    const a = projects[p], b = projects[(p + 1) % projects.length], c = projects[(p + 2) % projects.length];
    main.innerHTML = `
      <a class="v2-proj__main" href="${esc(a.url)}"${ext(a.url)}>
        <div class="v2-proj__img"><img src="${esc(a.img)}" alt="Capture du site ${esc(a.name)}" loading="lazy" width="1200" height="750"></div>
        <div class="v2-proj__meta"><p class="v2-proj__name">${esc(a.name)}</p><p class="v2-proj__tag">${esc(a.tag)}</p></div>
        <p class="v2-proj__text">${esc(a.text)}</p>
      </a>
      <div class="v2-proj__side">
        ${[b, c].map((x) => `<a href="${esc(x.url)}"${ext(x.url)}><div class="v2-proj__img"><img src="${esc(x.img)}" alt="Capture du site ${esc(x.name)}" loading="lazy" width="600" height="375"></div><p>${esc(x.name)}</p></a>`).join("")}
      </div>`;
    $("#v2-proj-pos").textContent = `${pad2(p + 1)} / ${pad2(projects.length)}`;
  };
  $("#v2-proj-prev")?.addEventListener("click", () => { p = (p - 1 + projects.length) % projects.length; paintProj(); });
  $("#v2-proj-next")?.addEventListener("click", () => { p = (p + 1) % projects.length; paintProj(); });
  paintProj();

  /* ---------- Offres ---------- */
  const plans = {
    starter: { badge: "STARTER", price: "1 490 €", sub: "Une landing page prête pour vos campagnes.", cta: "Voir le Starter", href: "/starter", desc: "Une landing page professionnelle, rapide et prête pour vos futures campagnes.", items: ["Audit express Google Ads et suivi des performances", "1 landing page de conversion", "Mise en place d'indicateurs simples à suivre", "Support prioritaire de démarrage"], note: "" },
    growth: { badge: "GROWTH · LE PLUS POPULAIRE", price: "1 990 €", sub: "+ 400 €/mois (3 mois minimum)", cta: "Voir le Growth", href: "/growth", desc: "Landing page + Google Ads + suivi des performances.", items: ["Gestion Google Ads sur plusieurs campagnes", "Landing pages et A/B tests prioritaires", "Suivi précis avec GTM, GA4 et les conversions", "Optimisations hebdomadaires selon les résultats"], note: "Budget publicitaire non inclus." },
    performance: { badge: "PERFORMANCE", price: "Sur devis", sub: "Pour les projets les plus ambitieux.", cta: "Voir le Performance", href: "/performance", desc: "Une stratégie d'acquisition et d'optimisation sur mesure pour les projets les plus ambitieux.", items: ["Stratégie de visibilité adaptée à vos canaux", "Outils de conversion et de suivi sur mesure", "Amélioration continue de vos performances et de vos conversions", "Suivi exécutif et arbitrages budgétaires"], note: "" },
  };
  const planTabs = $$(".v2-plantab");
  const setPlan = (k) => {
    const d = plans[k];
    planTabs.forEach((t) => t.setAttribute("aria-selected", String(t.dataset.plan === k)));
    $("#v2-plan-badge").textContent = d.badge;
    $("#v2-plan-price").textContent = d.price;
    $("#v2-plan-sub").textContent = d.sub;
    const cta = $("#v2-plan-cta");
    cta.textContent = d.cta + " →";
    cta.href = d.href;
    $("#v2-plan-desc").textContent = d.desc;
    $("#v2-plan-list").innerHTML = d.items.map((i) => `<li>${esc(i)}</li>`).join("");
    $("#v2-plan-note").textContent = d.note;
  };
  planTabs.forEach((t) => t.addEventListener("click", () => setPlan(t.dataset.plan)));
  if (planTabs.length) setPlan("growth");

  /* ---------- Avis ---------- */
  const reviews = [
    ["Service au top, réactif et à l'écoute. Je recommande à 100 %.", "Quentin BRIDON"],
    ["Super expérience avec Madapes Agency ! L'équipe est dispo, pro et donne vraiment de bonnes idées.", "Ismail AISSI"],
    ["Complètement satisfait. Hyper pro et très sérieux, je recommande vivement.", "Aiman BOULTOUAK"],
    ["À l'écoute et très pro, je recommande vivement !", "Yassin AMZIL"],
    ["Highly recommended.", "Umar Faruque"],
  ];
  let r = 0;
  const paintReview = () => {
    $("#v2-review-text").textContent = `“${reviews[r][0]}”`;
    $("#v2-review-name").textContent = reviews[r][1];
    $("#v2-review-pos").textContent = `${pad2(r + 1)} / ${pad2(reviews.length)}`;
  };
  $("#v2-review-prev")?.addEventListener("click", () => { r = (r - 1 + reviews.length) % reviews.length; paintReview(); });
  $("#v2-review-next")?.addEventListener("click", () => { r = (r + 1) % reviews.length; paintReview(); });
  if ($("#v2-review-text")) paintReview();

  /* ---------- FAQ ---------- */
  $$(".v2-faq__q").forEach((btn) =>
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      $$(".v2-faq__q").forEach((b) => {
        b.setAttribute("aria-expanded", "false");
        $("#" + b.getAttribute("aria-controls")).hidden = true;
        b.lastElementChild.textContent = "+";
      });
      if (!open) {
        btn.setAttribute("aria-expanded", "true");
        $("#" + btn.getAttribute("aria-controls")).hidden = false;
        btn.lastElementChild.textContent = "−";
      }
    })
  );
})();
