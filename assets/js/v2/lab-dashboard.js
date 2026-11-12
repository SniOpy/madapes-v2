/* Madapes Lab — Executive SaaS Dashboard (données fictives) */
"use strict";

(function () {
  const { $, missions } = window.MadapesV2;
  const app = $("#lab-app");
  if (!app) return;
  const M = missions("dashboard", ["period", "metric", "compare"]);

  const series = (n, base, trend, noise, seed) => {
    const out = []; let v = base;
    for (let i = 0; i < n; i++) { v = v * (1 + trend) + Math.sin(i * 1.7 + seed) * noise * base; out.push(Math.max(0, v)); }
    return out;
  };
  const P = {
    "7j": { n: 7, labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"], scale: 1, title: "7 derniers jours" },
    "30j": { n: 30, labels: ["1", "5", "10", "15", "20", "25", "30"], scale: 1, title: "30 derniers jours" },
    an: { n: 12, labels: ["Jan", "Mar", "Mai", "Juil", "Sep", "Nov"], scale: 30, title: "12 derniers mois" },
  };
  const fr = (v, d) => v.toFixed(d).replace(".", ",");
  const MET = {
    rev: { label: "Revenus", base: 4200, trend: 0.018, noise: 0.06, fmt: (v) => Math.round(v).toLocaleString("fr-FR") + " €", sum: true, good: 1 },
    conv: { label: "Taux de conversion", base: 3.1, trend: 0.006, noise: 0.05, fmt: (v) => fr(v, 2) + " %", sum: false, good: 1 },
    churn: { label: "Churn mensuel", base: 2.4, trend: -0.004, noise: 0.07, fmt: (v) => fr(v, 2) + " %", sum: false, good: -1 },
    mrr: { label: "MRR", base: 48000, trend: 0.012, noise: 0.015, fmt: (v) => fr(v / 1000, 1) + " k€", sum: false, good: 1 },
  };
  const S = { period: "30j", metric: "rev", compare: false };

  const calc = (key, seed) => {
    const m = MET[key], p = P[S.period], base = m.base * (m.sum ? p.scale : 1), tr = m.trend * (S.period === "an" ? 4 : 1);
    const cur = series(p.n, base, tr, m.noise, seed), prev = series(p.n, base * (m.good > 0 ? 0.86 : 1.12), tr, m.noise, seed + 2);
    const agg = (a) => (m.sum ? a.reduce((x, y) => x + y, 0) : a[a.length - 1]);
    const c = agg(cur), pv = agg(prev);
    return { m, cur, prev, value: m.fmt(c), d: ((c - pv) / pv) * 100, total: c };
  };

  const render = () => {
    const keys = ["rev", "conv", "churn", "mrr"], all = {};
    keys.forEach((k, i) => (all[k] = calc(k, i + 1)));
    const sel = all[S.metric], p = P[S.period];
    const vals = sel.cur.concat(S.compare ? sel.prev : []);
    const lo = Math.min(...vals) * 0.92, hi = Math.max(...vals) * 1.04;
    const X = (i) => 48 + (i / (p.n - 1)) * 742, Y = (v) => 248 - ((v - lo) / (hi - lo)) * 228;
    const path = (a) => a.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
    const line = path(sel.cur);
    const grid = [0, 1, 2, 3].map((i) => { const v = lo + (hi - lo) * (i / 3); return `<line x1="48" x2="790" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" stroke="#ECE8F6"/><text x="40" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#6B6B79" font-family="Poppins, sans-serif">${sel.m.fmt(v).replace(" €", "")}</text>`; }).join("");
    const xl = p.labels.map((l, i) => `<text x="${(48 + (i / (p.labels.length - 1)) * 742).toFixed(1)}" y="272" text-anchor="middle" font-size="11" fill="#6B6B79" font-family="Poppins, sans-serif">${l}</text>`).join("");
    const totalRev = all.rev.total;
    const ch = [["Abonnements", 0.54, "#7C3AED"], ["Upsell", 0.21, "#A855F7"], ["Partenaires", 0.15, "#D7BDFF"], ["Services", 0.1, "#9A9AA8"]];

    app.innerHTML = `
      <div class="v2-demo__bar">
        <div role="group" aria-label="Période" style="display:inline-flex;border:1px solid #DDD6EE;border-radius:10px;padding:3px;gap:2px">
          ${[["7j", "7 jours"], ["30j", "30 jours"], ["an", "Année"]].map(([k, l]) => `<button type="button" data-period="${k}" aria-pressed="${S.period === k}" style="border:0;border-radius:7px;padding:6px 14px;font-size:14px;cursor:pointer;background:${S.period === k ? "#14141A" : "transparent"};color:${S.period === k ? "#fff" : "#5C5C69"}">${l}</button>`).join("")}
        </div>
        <button type="button" data-compare aria-pressed="${S.compare}" style="margin-left:auto;display:inline-flex;gap:10px;align-items:center;background:none;border:1px solid #DDD6EE;border-radius:10px;padding:7px 12px;font-size:14px;cursor:pointer;color:#14141A">
          <span style="width:30px;height:18px;border-radius:999px;background:${S.compare ? "#7C3AED" : "#C9C2DD"};position:relative;display:inline-block"><span style="position:absolute;top:2px;left:${S.compare ? "14px" : "2px"};width:14px;height:14px;border-radius:50%;background:#fff;transition:left .2s"></span></span>
          Comparer à la période précédente
        </button>
      </div>
      <div role="group" aria-label="Métrique affichée" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;padding:16px 18px">
        ${keys.map((k) => { const r = all[k], good = r.d * r.m.good >= 0, on = S.metric === k; return `<button type="button" data-metric="${k}" aria-pressed="${on}" style="text-align:left;cursor:pointer;color:#14141A;background:${on ? "rgba(124,58,237,.06)" : "#F8F7FC"};border:1px solid ${on ? "#7C3AED" : "#E2DCF0"};border-radius:14px;padding:14px 16px"><span style="display:flex;justify-content:space-between;font-size:13px;color:#6B6B79"><span>${r.m.label}</span><span style="color:${good ? "#16a34a" : "#dc2626"}">${r.d >= 0 ? "+" : ""}${fr(r.d, 1)} %</span></span><span style="display:block;margin-top:4px;font-size:28px;letter-spacing:-.03em;font-variant-numeric:tabular-nums">${r.value}</span></button>`; }).join("")}
      </div>
      <div class="v2-demo__split">
        <div class="v2-demo__main" style="background:#fff;padding:20px 18px">
          <div style="display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;align-items:baseline;margin-bottom:8px">
            <p style="font-weight:600">${sel.m.label} · ${p.title}</p>
            <p class="v2-small" style="display:flex;gap:16px"><span>— Période actuelle</span>${S.compare ? "<span style=\"color:#A855F7\">- - Période précédente</span>" : ""}</p>
          </div>
          <svg viewBox="0 0 800 280" style="display:block;width:100%;height:auto" role="img" aria-label="${sel.m.label}, valeur actuelle ${sel.value}">
            ${grid}
            <path d="${line} L${X(p.n - 1).toFixed(1)} 248 L48 248 Z" fill="#7C3AED" fill-opacity=".08"/>
            ${S.compare ? `<path d="${path(sel.prev)}" fill="none" stroke="#A855F7" stroke-width="2" stroke-dasharray="5 5"/>` : ""}
            <path d="${line}" fill="none" stroke="#7C3AED" stroke-width="2.4" stroke-linejoin="round"/>
            <circle cx="${X(p.n - 1).toFixed(1)}" cy="${Y(sel.cur[p.n - 1]).toFixed(1)}" r="4.5" fill="#7C3AED" stroke="#fff" stroke-width="2"/>
            ${xl}
          </svg>
        </div>
        <div class="v2-demo__side">
          <p style="font-weight:600;margin-bottom:14px">Revenus par canal</p>
          <ul style="display:flex;flex-direction:column;gap:14px">
            ${ch.map((c) => `<li><div style="display:flex;justify-content:space-between;font-size:14px"><span>${c[0]}</span><span style="color:#5C5C69">${Math.round(totalRev * c[1]).toLocaleString("fr-FR")} €</span></div><div style="height:8px;border-radius:4px;background:#ECE8F6;margin-top:6px"><div style="height:8px;border-radius:4px;width:${Math.round((c[1] / 0.54) * 100)}%;background:${c[2]}"></div></div></li>`).join("")}
          </ul>
          <p style="font-weight:600;margin:22px 0 6px">Alerte automatique</p>
          <p style="font-size:14px;color:#5C5C69;border:1px solid #DDD6EE;border-radius:10px;padding:10px 12px"><span style="color:#F59E0B">●</span> ${all.churn.d > 0 ? "Le churn remonte : 4 comptes à risque détectés, relance automatique proposée." : "Churn en baisse sur la période : la séquence d'onboarding fonctionne."}</p>
        </div>
      </div>`;
  };

  app.addEventListener("click", (e) => {
    const t = e.target.closest("[data-period],[data-metric],[data-compare]");
    if (!t) return;
    if (t.dataset.period) { S.period = t.dataset.period; M.done("period"); }
    if (t.dataset.metric) { S.metric = t.dataset.metric; M.done("metric"); }
    if (t.hasAttribute("data-compare")) { S.compare = !S.compare; M.done("compare"); }
    render();
  });
  render();
})();
