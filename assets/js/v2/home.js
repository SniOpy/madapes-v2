/* Madapes V2 — interactions de la page d'accueil.
   Chaque changement d'état est animé si GSAP est dispo et que l'utilisateur
   accepte les animations (canAnimate) ; sinon, mise à jour instantanée. */
"use strict";

(function () {
  const { $, $$, esc, pad2, reduceMotion, canAnimate, splitWords } = window.MadapesV2;
  const g = () => window.gsap;

  /* ---------- Console du hero (onglets) ---------- */
  const tabs = $$(".v2-console [role=tab]");
  const selectTab = (tab, focus) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      $("#" + t.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) tab.focus();
    const panel = $("#" + tab.getAttribute("aria-controls"));
    if (canAnimate() && panel) {
      g().fromTo(panel.children, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.06, ease: "expo.out", overwrite: true });
      const bars = $$(".v2-bars span", panel);
      if (bars.length) g().fromTo(bars, { scaleY: 0 }, { scaleY: 1, duration: 0.9, stagger: 0.05, ease: "expo.out", transformOrigin: "50% 100%" });
      const ring = panel.querySelector("circle[stroke-dasharray]");
      if (ring) g().fromTo(ring, { strokeDashoffset: 402 }, { strokeDashoffset: 88, duration: 1.4, ease: "expo.out" });
    }
    document.dispatchEvent(new CustomEvent("v2:tab", { detail: { tab } }));
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => selectTab(tab));
    /* Navigation clavier attendue sur un tablist (flèches gauche/droite). */
    tab.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      selectTab(tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length], true);
    });
  });

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
    if (canAnimate() && !feed.closest("[hidden]")) {
      const [first, ...rest] = feed.children;
      g().fromTo(first, { x: -14, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7, ease: "expo.out" });
      g().fromTo(rest, { y: -12 }, { y: 0, duration: 0.6, ease: "expo.out", stagger: 0.03 });
    }
  };
  paintFeed();
  if (!reduceMotion) setInterval(() => { tick++; paintFeed(); }, 2200);

  /* ---------- Méthode (stepper) ---------- */
  const steps = [
    ["Analyse", "On étudie votre activité, votre marché et vos objectifs pour construire la bonne stratégie."],
    ["Stratégie", "On définit un plan d'action sur-mesure orienté acquisition et performance."],
    ["Création", "On conçoit des supports rapides, modernes et pensés pour convertir."],
    ["Tracking & optimisation", "On implémente le tracking (GTM, GA4, Ads) et on optimise en continu."],
    ["Résultats", "Plus de visibilité, plus de demandes clients, et une activité qui progresse durablement."],
  ];
  const stepBtns = $$(".v2-step");
  let currentStep = -1;
  let stepTl = null;
  const setStep = (i) => {
    if (i === currentStep) return;
    const dir = i > currentStep ? 1 : -1;
    const first = currentStep === -1;
    currentStep = i;
    stepBtns.forEach((b, j) => {
      b.setAttribute("aria-selected", String(i === j));
      b.tabIndex = i === j ? 0 : -1;
      b.classList.toggle("is-done", j <= i);
    });
    $(".v2-stepper__fill").style.width = `calc((100% - 44px) * ${i / 4})`;
    const nEl = $("#v2-step-n");
    const title = $("#v2-step-title");
    const text = $("#v2-step-text");
    if (first || !canAnimate()) {
      nEl.innerHTML = `<span>${pad2(i + 1)}</span>`;
      title.textContent = steps[i][0];
      text.textContent = steps[i][1];
      return;
    }
    /* Le grand numéro « roule » dans le sens de la progression.
       Changements rapides (scroll) : on coupe la timeline précédente et on ne garde que le dernier chiffre. */
    if (stepTl) stepTl.kill();
    const kids = Array.from(nEl.children);
    kids.slice(0, -1).forEach((k) => k.remove());
    const old = kids[kids.length - 1];
    const neu = document.createElement("span");
    neu.textContent = pad2(i + 1);
    nEl.style.position = "relative";
    if (old) Object.assign(old.style, { position: "absolute", left: "0", top: "0" });
    nEl.appendChild(neu);
    stepTl = g().timeline({ defaults: { ease: "expo.out" }, onComplete: () => old && old.remove() })
      .to(old || {}, { yPercent: -100 * dir, opacity: 0, duration: 0.6 }, 0)
      .fromTo(neu, { yPercent: 100 * dir, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8 }, 0)
      .to([title, text], { y: -10 * dir, opacity: 0, duration: 0.2, ease: "power2.in" }, 0)
      .add(() => { title.textContent = steps[i][0]; text.textContent = steps[i][1]; })
      .fromTo([title, text], { y: 18 * dir, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.07 });
  };
  stepBtns.forEach((b, i) => {
    b.addEventListener("click", () => {
      /* Quand la section est épinglée au scroll, motion.js reprend la main (scroll vers l'étape). */
      const ev = new CustomEvent("v2:step-request", { detail: { index: i }, cancelable: true });
      if (document.dispatchEvent(ev)) setStep(i);
    });
    b.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      const n = (i + (e.key === "ArrowRight" ? 1 : stepBtns.length - 1)) % stepBtns.length;
      stepBtns[n].focus();
      stepBtns[n].click();
    });
  });
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
  let projBusy = false;
  const ext = (u) => (u.startsWith("http") ? ' target="_blank" rel="noopener"' : "");
  const projMain = $("#projects-list");
  const renderProj = () => {
    const a = projects[p], b = projects[(p + 1) % projects.length], c = projects[(p + 2) % projects.length];
    projMain.innerHTML = `
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
  /* Rideau directionnel : l'image sort d'un côté, la suivante se dévoile de l'autre. */
  const goProj = (dir) => {
    if (!projMain || projBusy) return;
    p = (p + dir + projects.length) % projects.length;
    if (!canAnimate()) return renderProj();
    projBusy = true;
    const outClip = dir > 0 ? "inset(0% 100% 0% 0%)" : "inset(0% 0% 0% 100%)";
    const inClip = dir > 0 ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)";
    g().timeline({ onComplete: () => { renderProj(); intro(); } })
      .to($$(".v2-proj__img", projMain), { clipPath: outClip, duration: 0.5, ease: "expo.in", stagger: 0.05 }, 0)
      .to($$(".v2-proj__meta, .v2-proj__text, .v2-proj__side p", projMain), { y: -14, opacity: 0, duration: 0.3, ease: "power2.in" }, 0);
    const intro = () => {
      g().timeline({ defaults: { ease: "expo.out" }, onComplete: () => { projBusy = false; } })
        .fromTo($$(".v2-proj__img", projMain), { clipPath: inClip }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1, stagger: 0.08 }, 0)
        .fromTo($$(".v2-proj__img img", projMain), { scale: 1.25 }, { scale: 1, duration: 1.3, clearProps: "transform" }, 0)
        .fromTo($$(".v2-proj__meta, .v2-proj__text, .v2-proj__side p", projMain), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.06 }, 0.2);
    };
  };
  $("#v2-proj-prev")?.addEventListener("click", () => goProj(-1));
  $("#v2-proj-next")?.addEventListener("click", () => goProj(1));
  if (projMain) renderProj();

  /* ---------- Offres ---------- */
  const plans = {
    starter: { badge: "STARTER", price: "1 490 €", sub: "Une landing page prête pour vos campagnes.", cta: "Voir le Starter", href: "/starter", desc: "Une landing page professionnelle, rapide et prête pour vos futures campagnes.", items: ["Audit express Google Ads et suivi des performances", "1 landing page de conversion", "Mise en place d'indicateurs simples à suivre", "Support prioritaire de démarrage"], note: "" },
    growth: { badge: "GROWTH · LE PLUS POPULAIRE", price: "1 990 €", sub: "+ 400 €/mois (3 mois minimum)", cta: "Voir le Growth", href: "/growth", desc: "Landing page + Google Ads + suivi des performances.", items: ["Gestion Google Ads sur plusieurs campagnes", "Landing pages et A/B tests prioritaires", "Suivi précis avec GTM, GA4 et les conversions", "Optimisations hebdomadaires selon les résultats"], note: "Budget publicitaire non inclus." },
    performance: { badge: "PERFORMANCE", price: "Sur devis", sub: "Pour les projets les plus ambitieux.", cta: "Voir le Performance", href: "/performance", desc: "Une stratégie d'acquisition et d'optimisation sur mesure pour les projets les plus ambitieux.", items: ["Stratégie de visibilité adaptée à vos canaux", "Outils de conversion et de suivi sur mesure", "Amélioration continue de vos performances et de vos conversions", "Suivi exécutif et arbitrages budgétaires"], note: "" },
  };
  const planTabs = $$(".v2-plantab");
  const priceNum = (s) => { const n = parseInt(String(s).replace(/\D/g, ""), 10); return Number.isFinite(n) ? n : null; };
  const fmtPrice = (n) => `${Math.round(n).toLocaleString("fr-FR").replace(/ | /g, " ")} €`;
  let currentPlan = null;
  const setPlan = (k) => {
    const d = plans[k];
    const prev = currentPlan ? plans[currentPlan] : null;
    currentPlan = k;
    planTabs.forEach((t) => {
      const on = t.dataset.plan === k;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
    const priceEl = $("#v2-plan-price");
    const fill = () => {
      $("#v2-plan-badge").textContent = d.badge;
      $("#v2-plan-sub").textContent = d.sub;
      const cta = $("#v2-plan-cta");
      cta.textContent = d.cta + " →";
      cta.href = d.href;
      $("#v2-plan-desc").textContent = d.desc;
      $("#v2-plan-list").innerHTML = d.items.map((i) => `<li>${esc(i)}</li>`).join("");
      $("#v2-plan-note").textContent = d.note;
    };
    if (!prev || !canAnimate()) {
      fill();
      priceEl.textContent = d.price;
      return;
    }
    fill();
    const tl = g().timeline({ defaults: { ease: "expo.out" } });
    tl.fromTo(["#v2-plan-badge", "#v2-plan-sub", "#v2-plan-desc", "#v2-plan-cta"], { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.04 }, 0)
      .fromTo("#v2-plan-list li", { x: -16, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7, stagger: 0.06 }, 0.08);
    const from = priceNum(prev.price), to = priceNum(d.price);
    if (from !== null && to !== null) {
      const o = { v: from };
      tl.to(o, { v: to, duration: 0.9, ease: "expo.out", onUpdate: () => (priceEl.textContent = fmtPrice(o.v)), onComplete: () => (priceEl.textContent = d.price) }, 0);
    } else {
      tl.to(priceEl, { yPercent: 30, opacity: 0, duration: 0.2, ease: "power2.in" }, 0)
        .add(() => (priceEl.textContent = d.price))
        .fromTo(priceEl, { yPercent: -30, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7 });
    }
  };
  planTabs.forEach((t, i) => {
    t.addEventListener("click", () => {
      setPlan(t.dataset.plan);
      document.dispatchEvent(new CustomEvent("v2:plan", { detail: { tab: t } }));
    });
    t.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      const n = planTabs[(i + (e.key === "ArrowRight" ? 1 : planTabs.length - 1)) % planTabs.length];
      n.focus();
      n.click();
    });
  });
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
  let reviewBusy = false;
  const quote = $("#v2-review-text");
  const paintReview = (animate) => {
    const write = () => {
      quote.textContent = `“${reviews[r][0]}”`;
      $("#v2-review-name").textContent = reviews[r][1];
      $("#v2-review-pos").textContent = `${pad2(r + 1)} / ${pad2(reviews.length)}`;
    };
    if (!animate || !canAnimate()) return write();
    if (reviewBusy) return write();
    reviewBusy = true;
    const words = $$(".v2-wi", quote);
    g().to(words.length ? words : quote, {
      yPercent: -100, opacity: 0, duration: 0.35, stagger: 0.006, ease: "power2.in",
      onComplete: () => {
        write();
        g().set(quote, { clearProps: "opacity,transform" });
        g().fromTo(splitWords(quote), { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.025, ease: "expo.out", onComplete: () => (reviewBusy = false) });
        g().fromTo("#v2-review-name", { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "expo.out", delay: 0.2 });
      },
    });
  };
  $("#v2-review-prev")?.addEventListener("click", () => { r = (r - 1 + reviews.length) % reviews.length; paintReview(true); });
  $("#v2-review-next")?.addEventListener("click", () => { r = (r + 1) % reviews.length; paintReview(true); });
  if (quote) paintReview(false);

  /* ---------- FAQ (accordéon à hauteur animée) ---------- */
  const faqBtns = $$(".v2-faq__q");
  const closeFaq = (b) => {
    const a = $("#" + b.getAttribute("aria-controls"));
    b.setAttribute("aria-expanded", "false");
    b.lastElementChild.textContent = "+";
    if (!canAnimate()) { a.hidden = true; return; }
    g().to(a, { height: 0, paddingBottom: 0, opacity: 0, duration: 0.45, ease: "expo.inOut", onComplete: () => { a.hidden = true; g().set(a, { clearProps: "height,paddingBottom,opacity" }); } });
  };
  const openFaq = (b) => {
    const a = $("#" + b.getAttribute("aria-controls"));
    b.setAttribute("aria-expanded", "true");
    b.lastElementChild.textContent = "−";
    a.hidden = false;
    if (!canAnimate()) return;
    g().from(a, { height: 0, paddingBottom: 0, opacity: 0, duration: 0.6, ease: "expo.out", clearProps: "height,paddingBottom,opacity" });
  };
  faqBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      faqBtns.forEach((b) => { if (b.getAttribute("aria-expanded") === "true") closeFaq(b); });
      if (!open) openFaq(btn);
    })
  );

  window.MadapesHome = { setStep, stepCount: steps.length };
})();
