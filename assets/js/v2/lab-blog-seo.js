/* Madapes Lab — Blog & SEO admin (back-office de blog avec score SEO en direct, données fictives) */
"use strict";

(function () {
  const { $, esc, missions } = window.MadapesV2;
  const app = $("#lab-app");
  if (!app) return;
  const M = missions("blog-seo", ["open", "score", "publish"]);

  const posts = [
    { title: "Google Ads : 5 leviers pour baisser votre coût par lead", slug: "baisser-cout-par-lead-google-ads", kw: "coût par lead", meta: "Enchères, mots-clés négatifs, landing page : 5 leviers concrets pour baisser votre coût par lead Google Ads sans réduire le volume de demandes.", status: "Publié", date: "28 oct. 2026", views: 1842, body: "Votre coût par lead grimpe alors que votre budget reste le même ? Voici 5 leviers que nous activons sur chaque compte.\n\n## 1. Nettoyer les mots-clés\nLes mots-clés négatifs évitent de payer pour des recherches sans intention d'achat. Sur un compte local, c'est souvent une part importante du budget récupérée.\n\n## 2. Aligner annonce et landing page\nLe message de l'annonce doit se retrouver mot pour mot en haut de la page. Voir notre guide [landing page](/blog/landing-page-erreurs).\n\n## 3. Suivre les vraies conversions\nSans suivi des appels et des formulaires, Google optimise à l'aveugle et le coût par lead dérive.\n\n![Tableau de bord des conversions](conversions.png)" },
    { title: "Landing page : 7 erreurs qui font fuir vos visiteurs", slug: "landing-page-erreurs", kw: "landing page", meta: "Temps de chargement, formulaire trop long, message flou : les 7 erreurs de landing page qui font chuter votre taux de conversion.", status: "Publié", date: "14 oct. 2026", views: 1276, body: "Une landing page qui ne convertit pas coûte cher.\n\n## Erreur 1 : une page trop lente\nAu-delà de 3 secondes, une grande partie des visiteurs mobiles repart." },
    { title: "GA4 tuto", slug: "ga4", kw: "suivi des conversions GA4", meta: "", status: "Brouillon", date: "2 nov. 2026", views: 0, body: "Dans cet article on va voir comment configurer GA4." },
    { title: "SEO local : apparaître dans le pack Google Maps", slug: "seo-local-google-maps", kw: "SEO local", meta: "Fiche Google Business, avis, pages locales : la méthode pour apparaître dans le pack Google Maps de votre ville.", status: "Programmé", date: "12 nov. 2026", views: 0, body: "Le SEO local commence par une fiche Google Business complète.\n\n## Les avis clients\nLe nombre et la fraîcheur des avis comptent." },
  ];
  const S = { view: "list", cur: 0, saved: "" };

  const words = (t) => (t.trim().match(/\S+/g) || []).length;
  const norm = (t) => (t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const checks = (p) => {
    const kw = norm(p.kw).trim(), body = norm(p.body), w = words(p.body);
    const occ = kw ? body.split(kw).length - 1 : 0, dens = w ? ((occ * kw.split(" ").length) / w) * 100 : 0;
    return [
      ["Titre entre 40 et 60 caractères", p.title.length >= 40 && p.title.length <= 60],
      ["Mot-clé dans le titre", !!kw && norm(p.title).includes(kw)],
      ["Meta description entre 120 et 160 caractères", p.meta.length >= 120 && p.meta.length <= 160],
      ["Mot-clé dans la meta description", !!kw && norm(p.meta).includes(kw)],
      ["Mot-clé dans l'URL", !!kw && norm(p.slug).includes(kw.replace(/[^a-z0-9]+/g, "-"))],
      ["Mot-clé dans le premier paragraphe", !!kw && body.split("\n")[0].includes(kw)],
      ["Au moins 2 intertitres (##)", (p.body.match(/^## /gm) || []).length >= 2],
      ["Au moins 120 mots (démo ; 800+ en réel)", w >= 120],
      ["Un lien interne", /\]\(\/blog\//.test(p.body)],
      ["Une image avec texte alternatif", /!\[[^\]]+\]\(/.test(p.body)],
      ["Densité du mot-clé entre 0,5 et 3 %", dens >= 0.5 && dens <= 3],
    ];
  };
  const score = (p) => { const c = checks(p); return Math.round((c.filter((x) => x[1]).length / c.length) * 100); };
  const color = (s) => (s >= 80 ? "#16a34a" : s >= 50 ? "#d97706" : "#dc2626");
  const cut = (t, n) => (t.length > n ? t.slice(0, n - 1) + "…" : t);
  const statusStyle = { Publié: ["#DCFCE7", "#166534"], Brouillon: ["#EEEAF7", "#5C5C69"], Programmé: ["#EDE7FB", "#5B21B6"] };

  const shell = (inner) => `
    <div style="display:flex;flex-wrap:wrap">
      <nav aria-label="Menu du back-office" style="flex:0 0 210px;background:#F8F7FC;border-right:1px solid #E7E2F3;padding:18px 12px;display:flex;flex-direction:column;gap:4px">
        <p style="margin:0 8px 12px;font-weight:600;font-size:14px">Mon blog <span style="color:#6B6B79;font-weight:400">· admin</span></p>
        ${[["Articles", posts.length], ["Brouillons", posts.filter((x) => x.status === "Brouillon").length], ["Médias", 48], ["Mots-clés", 31], ["Statistiques", ""]].map(([l, c], i) => `<button type="button" data-act="list" ${i === 0 ? 'aria-current="page"' : ""} style="text-align:left;border:0;border-radius:10px;padding:9px 12px;display:flex;justify-content:space-between;cursor:pointer;font-size:14px;background:${i === 0 ? "rgba(124,58,237,.12)" : "transparent"};color:${i === 0 ? "#14141A" : "#5C5C69"}">${l}<span class="v2-small">${c}</span></button>`).join("")}
        <div style="margin-top:auto;border-top:1px solid #E7E2F3;padding:14px 8px 0">
          <p class="v2-small">Score SEO moyen</p>
          ${(() => { const a = Math.round(posts.reduce((s, p) => s + score(p), 0) / posts.length); return `<p style="font-size:26px;font-weight:600;color:${color(a)}">${a}<span class="v2-small">/100</span></p>`; })()}
        </div>
      </nav>
      <div style="flex:1 1 640px;min-width:0">${inner}</div>
    </div>`;

  const renderList = () => {
    const kpi = (l, v) => `<div style="background:#F8F7FC;border:1px solid #E7E2F3;border-radius:12px;padding:12px 14px"><p class="v2-small">${l}</p><p style="font-size:22px;font-weight:600">${v}</p></div>`;
    app.innerHTML = shell(`
      <div style="padding:18px">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:18px">
          ${kpi("Visites (30 j)", posts.reduce((a, x) => a + x.views, 0).toLocaleString("fr-FR"))}${kpi("Articles en ligne", posts.filter((x) => x.status === "Publié").length)}${kpi("Mots-clés en top 10", 14)}${kpi("Demandes via le blog", 23)}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><p style="font-weight:600">Articles</p><button type="button" class="v2-btn v2-btn--primary" style="padding:9px 14px;font-size:13.5px" data-act="new">+ Nouvel article</button></div>
        <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:14px;min-width:620px">
          <thead><tr class="v2-small" style="text-align:left"><th style="padding:10px 8px;font-weight:500">Titre</th><th style="padding:10px 8px;font-weight:500">Statut</th><th style="padding:10px 8px;font-weight:500">Score SEO</th><th style="padding:10px 8px;font-weight:500">Visites</th><th></th></tr></thead>
          <tbody>${posts.map((p, i) => { const s = score(p), st = statusStyle[p.status]; return `<tr style="border-top:1px solid #EEEAF7"><td style="padding:12px 8px"><b style="display:block;font-weight:500">${esc(p.title)}</b><span class="v2-small">/blog/${esc(p.slug)} · ${esc(p.date)}</span></td><td style="padding:12px 8px"><span style="font-size:12.5px;border-radius:6px;padding:3px 8px;background:${st[0]};color:${st[1]}">${p.status}</span></td><td style="padding:12px 8px"><span style="display:inline-flex;align-items:center;gap:8px"><span style="width:56px;height:6px;border-radius:3px;background:#ECE8F6;display:inline-block"><span style="display:block;height:6px;border-radius:3px;width:${s}%;background:${color(s)}"></span></span><b style="color:${color(s)}">${s}</b></span></td><td style="padding:12px 8px">${p.views ? p.views.toLocaleString("fr-FR") : "—"}</td><td style="padding:12px 8px;text-align:right"><button type="button" data-edit="${i}" style="font-size:13px;cursor:pointer;border:1px solid #CFC6E6;background:none;border-radius:8px;padding:6px 12px">Modifier</button></td></tr>`; }).join("")}</tbody>
        </table></div>
      </div>`);
  };

  const renderEdit = () => {
    const p = posts[S.cur];
    app.innerHTML = shell(`
      <div style="display:flex;flex-wrap:wrap">
        <div style="flex:999 1 420px;min-width:0;padding:18px;display:flex;flex-direction:column;gap:14px">
          <div style="display:flex;justify-content:space-between"><button type="button" data-act="list" style="border:0;background:none;color:#5C5C69;cursor:pointer;padding:0">← Tous les articles</button><span class="v2-small" id="bl-saved">${S.saved || "Modifications non enregistrées"}</span></div>
          <div><label class="v2-label" for="bl-title">Titre SEO <span id="bl-tlen" style="float:right"></span></label><input class="v2-input" id="bl-title" data-field="title" value="${esc(p.title)}" style="font-size:16px;font-weight:600"></div>
          <div style="display:flex;flex-wrap:wrap;gap:12px">
            <div style="flex:1 1 200px"><label class="v2-label" for="bl-kw">Mot-clé principal</label><input class="v2-input" id="bl-kw" data-field="kw" value="${esc(p.kw)}"></div>
            <div style="flex:1 1 200px"><label class="v2-label" for="bl-slug">URL (slug)</label><input class="v2-input" id="bl-slug" data-field="slug" value="${esc(p.slug)}"></div>
          </div>
          <div><label class="v2-label" for="bl-meta">Meta description <span id="bl-mlen" style="float:right"></span></label><textarea class="v2-input" id="bl-meta" data-field="meta" rows="2" style="resize:vertical">${esc(p.meta)}</textarea></div>
          <div><label class="v2-label" for="bl-body">Contenu <span id="bl-words" style="float:right"></span></label><textarea class="v2-input" id="bl-body" data-field="body" rows="11" style="resize:vertical;line-height:1.7">${esc(p.body)}</textarea></div>
        </div>
        <aside style="flex:1 1 320px;min-width:0;background:#F8F7FC;border-left:1px solid #E7E2F3;padding:18px;display:flex;flex-direction:column;gap:16px" id="bl-seo"></aside>
      </div>`);
    paintSeo();
  };

  const paintSeo = () => {
    const p = posts[S.cur], c = checks(p), s = score(p), ok = c.filter((x) => x[1]).length;
    const tl = p.title.length, ml = p.meta.length;
    $("#bl-tlen").innerHTML = `<span style="color:${tl >= 40 && tl <= 60 ? "#16a34a" : "#d97706"}">${tl} / 60</span>`;
    $("#bl-mlen").innerHTML = `<span style="color:${ml >= 120 && ml <= 160 ? "#16a34a" : "#d97706"}">${ml} / 160</span>`;
    $("#bl-words").textContent = `${words(p.body)} mots · ## pour un intertitre`;
    $("#bl-seo").innerHTML = `
      <div style="display:flex;align-items:center;gap:16px">
        <svg viewBox="0 0 100 100" width="96" height="96" role="img" aria-label="Score SEO ${s} sur 100"><circle cx="50" cy="50" r="42" fill="none" stroke="#ECE8F6" stroke-width="9"/><circle cx="50" cy="50" r="42" fill="none" stroke="${color(s)}" stroke-width="9" stroke-linecap="round" stroke-dasharray="264" stroke-dashoffset="${Math.round(264 * (1 - s / 100))}" transform="rotate(-90 50 50)" style="transition:stroke-dashoffset .5s"/><text x="50" y="57" text-anchor="middle" font-size="24" font-weight="700" fill="#14141A" font-family="Poppins, sans-serif">${s}</text></svg>
        <div><p style="font-weight:600;font-size:17px;color:${color(s)}">${s >= 80 ? "Bien optimisé" : s >= 50 ? "À améliorer" : "Insuffisant"}</p><p class="v2-small">${ok} critères validés sur ${c.length}</p></div>
      </div>
      <div><p class="v2-small" style="text-transform:uppercase;letter-spacing:.12em;margin-bottom:8px">Aperçu Google</p>
        <div style="background:#fff;border:1px solid #E7E2F3;border-radius:12px;padding:14px;font-family:Arial,sans-serif">
          <p style="font-size:12px;color:#202124">monsite.fr › blog › ${esc(p.slug)}</p>
          <p style="margin-top:4px;font-size:18px;line-height:1.3;color:#1A0DAB">${esc(cut(p.title || "Titre de l'article", 60))}</p>
          <p style="margin-top:4px;font-size:13px;line-height:1.5;color:#4D5156">${esc(cut(p.meta || "Ajoutez une meta description : Google affichera sinon un extrait choisi au hasard dans la page.", 160))}</p>
        </div></div>
      <div><p class="v2-small" style="text-transform:uppercase;letter-spacing:.12em;margin-bottom:8px">Checklist SEO</p>
        <ul style="display:flex;flex-direction:column;gap:6px">${c.map(([l, o]) => `<li style="display:flex;gap:10px;font-size:13.5px"><span aria-hidden="true" style="flex:none;width:18px;height:18px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;background:${o ? "#16a34a" : "#d97706"}">${o ? "✓" : "!"}</span><span style="color:${o ? "#14141A" : "#5C5C69"}">${l}</span></li>`).join("")}</ul></div>
      <button type="button" class="v2-btn v2-btn--primary" data-act="publish" ${s < 70 ? "disabled" : ""} style="justify-content:center;opacity:${s < 70 ? 0.45 : 1}">${p.status === "Publié" ? "Mettre à jour l'article" : "Publier l'article"}</button>
      <p class="v2-small" style="text-align:center;margin-top:-6px">Publication possible à partir de 70/100</p>`;
  };

  /* Saisie : mise à jour du score sans reconstruire les champs (le curseur reste en place) */
  app.addEventListener("input", (e) => {
    const f = e.target.dataset.field;
    if (!f) return;
    posts[S.cur][f] = e.target.value;
    S.saved = "Brouillon enregistré · " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    $("#bl-saved").textContent = S.saved;
    if (score(posts[S.cur]) >= 80) M.done("score");
    paintSeo();
  });
  app.addEventListener("click", (e) => {
    const t = e.target.closest("[data-act],[data-edit]");
    if (!t) return;
    if (t.dataset.edit) { S.cur = +t.dataset.edit; S.view = "edit"; S.saved = ""; M.done("open"); return renderEdit(); }
    const a = t.dataset.act;
    if (a === "list") { S.view = "list"; return renderList(); }
    if (a === "new") { posts.push({ title: "Nouvel article", slug: "nouvel-article", kw: "", meta: "", status: "Brouillon", date: "Aujourd'hui", views: 0, body: "" }); S.cur = posts.length - 1; S.view = "edit"; M.done("open"); return renderEdit(); }
    if (a === "publish" && score(posts[S.cur]) >= 70) { const p = posts[S.cur]; if (p.status !== "Publié") { p.status = "Publié"; p.date = "Aujourd'hui"; } M.done("publish"); S.view = "list"; return renderList(); }
  });
  renderList();
})();
