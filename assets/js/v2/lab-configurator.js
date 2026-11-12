/* Madapes Lab — Configurateur produit (marque fictive, prix fictifs) */
"use strict";

(function () {
  const { $, esc, missions } = window.MadapesV2;
  const app = $("#lab-app");
  if (!app) return;
  const M = missions("configurateur", ["color", "mat", "engrave"]);

  const COLORS = [
    { id: "night", name: "Bleu nuit", hex: "#243248", pocket: "#1B2638", strap: "#141C29" },
    { id: "sage", name: "Sauge", hex: "#7E9480", pocket: "#6A7F6C", strap: "#55675A" },
    { id: "clay", name: "Terracotta", hex: "#C2693F", pocket: "#A85A35", strap: "#8A4829" },
    { id: "sand", name: "Sable", hex: "#D9C7A5", pocket: "#C4B08D", strap: "#A8946F" },
    { id: "violet", name: "Violet Madapes", hex: "#7C3AED", pocket: "#6D28D9", strap: "#5B21B6" },
  ];
  const MATS = [
    { id: "canvas", name: "Toile coton ciré", desc: "Résistante, patine avec le temps", add: 0, sheen: 0.05, stitch: "6 5", delay: "5 jours" },
    { id: "nylon", name: "Nylon recyclé", desc: "Léger, déperlant", add: 15, sheen: 0.12, stitch: "0", delay: "3 jours" },
    { id: "leather", name: "Cuir végétal", desc: "Tannage végétal, finition mate", add: 60, sheen: 0.22, stitch: "3 3", delay: "10 jours" },
  ];
  const OPTS = [
    { id: "laptop", name: 'Poche ordinateur 15"', add: 15 },
    { id: "usb", name: "Port de charge USB-C", add: 19 },
    { id: "reflect", name: "Bande réfléchissante", add: 9 },
  ];
  const BASE = 129;
  const S = { color: "night", mat: "canvas", opts: { laptop: true }, engrave: "" };
  const eur = (n) => n.toLocaleString("fr-FR") + " €";

  const productSvg = () => {
    const C = COLORS.find((c) => c.id === S.color), Mt = MATS.find((m) => m.id === S.mat), light = S.color === "sand";
    const zip = light ? "#7A6A4F" : "#C9C9CF", patch = light ? "#3A2F22" : "#E8E2D4", patchText = light ? "#E8E2D4" : "#2A241B";
    return `<svg viewBox="0 0 360 400" style="width:min(100%,420px);height:auto;display:block" role="img" aria-label="Sac à dos ${C.name} en ${Mt.name}">
      <ellipse cx="180" cy="378" rx="120" ry="12" fill="#14141A" fill-opacity=".12"/>
      <path d="M150 44 Q180 14 210 44" fill="none" stroke="${C.strap}" stroke-width="12" stroke-linecap="round"/>
      <path d="M80 110 Q80 52 180 52 Q280 52 280 110 L284 330 Q284 366 248 366 L112 366 Q76 366 76 330 Z" fill="${C.hex}" style="transition:fill .35s"/>
      <path d="M80 110 Q80 52 180 52 Q280 52 280 110" fill="none" stroke="#fff" stroke-opacity="${Mt.sheen}" stroke-width="6"/>
      <path d="M96 118 Q180 96 264 118" fill="none" stroke="${zip}" stroke-width="3" stroke-dasharray="${Mt.stitch}"/>
      <rect x="110" y="210" width="140" height="120" rx="22" fill="${C.pocket}" style="transition:fill .35s"/>
      <path d="M118 226 H242" stroke="${zip}" stroke-width="3" stroke-dasharray="${Mt.stitch}"/>
      <rect x="174" y="218" width="12" height="18" rx="3" fill="${zip}"/>
      <rect x="140" y="148" width="80" height="34" rx="8" fill="${patch}"/>
      <text x="180" y="171" text-anchor="middle" font-size="15" font-weight="600" fill="${patchText}" font-family="Poppins, sans-serif" letter-spacing="1.5">${esc(S.engrave.trim() ? S.engrave.toUpperCase() : "ATLAS")}</text>
      ${S.opts.reflect ? '<rect x="110" y="300" width="140" height="8" rx="4" fill="#F5F5F0" fill-opacity=".85"/>' : ""}
      ${S.opts.usb ? '<rect x="282" y="160" width="14" height="26" rx="4" fill="#1A1A1E" stroke="#3A3A48"/><rect x="286" y="168" width="6" height="10" rx="1" fill="#A855F7"/>' : ""}
      ${S.opts.laptop ? `<path d="M90 190 V342" stroke="${zip}" stroke-width="3" stroke-opacity=".8"/>` : ""}
    </svg>`;
  };

  const paintProduct = () => {
    const Mt = MATS.find((m) => m.id === S.mat);
    $("#cf-product").innerHTML = productSvg();
    $("#cf-badge").textContent = `ATLAS 22 L · ${Mt.name.toUpperCase()}`;
    const optSum = OPTS.reduce((a, o) => a + (S.opts[o.id] ? o.add : 0), 0), eng = S.engrave.trim() ? 12 : 0;
    const lines = [["Sac Atlas 22 L", eur(BASE)], [Mt.name, Mt.add ? "+" + eur(Mt.add) : "inclus"], ...OPTS.filter((o) => S.opts[o.id]).map((o) => [o.name, "+" + eur(o.add)])];
    if (eng) lines.push([`Gravure « ${S.engrave.toUpperCase()} »`, "+" + eur(eng)]);
    $("#cf-lines").innerHTML = lines.map(([l, v]) => `<dt>${esc(l)}</dt><dd style="margin:0">${v}</dd>`).join("");
    $("#cf-total").textContent = eur(BASE + Mt.add + optSum + eng);
    $("#cf-delay").textContent = `Fabrication : ${Mt.delay} · prix fictifs de démonstration`;
  };

  const paintOptions = () => {
    const C = COLORS.find((c) => c.id === S.color);
    $("#cf-colorname").textContent = C.name;
    $("#cf-colors").innerHTML = COLORS.map((c) => `<button type="button" data-color="${c.id}" aria-pressed="${c.id === S.color}" aria-label="${c.name}" style="width:44px;height:44px;border-radius:50%;cursor:pointer;background:${c.hex};border:2px solid ${c.id === S.color ? "#7C3AED" : "#DDD6EE"};box-shadow:inset 0 0 0 3px #fff"></button>`).join("");
    $("#cf-mats").innerHTML = MATS.map((m) => `<button type="button" data-mat="${m.id}" aria-pressed="${m.id === S.mat}" style="display:flex;justify-content:space-between;text-align:left;cursor:pointer;color:#14141A;background:${m.id === S.mat ? "rgba(124,58,237,.06)" : "transparent"};border:1px solid ${m.id === S.mat ? "#7C3AED" : "#DDD6EE"};border-radius:12px;padding:11px 14px;font-size:14.5px"><span><span style="display:block">${m.name}</span><span class="v2-small">${m.desc}</span></span><span style="color:#5C5C69">${m.add ? "+" + eur(m.add) : "inclus"}</span></button>`).join("");
    $("#cf-opts").innerHTML = OPTS.map((o) => { const on = !!S.opts[o.id]; return `<button type="button" data-opt="${o.id}" aria-pressed="${on}" style="display:flex;align-items:center;gap:12px;text-align:left;cursor:pointer;color:#14141A;background:${on ? "rgba(124,58,237,.06)" : "transparent"};border:1px solid ${on ? "#7C3AED" : "#DDD6EE"};border-radius:12px;padding:10px 14px;font-size:14.5px"><span style="width:18px;height:18px;border-radius:5px;border:1.5px solid ${on ? "#7C3AED" : "#C9C2DD"};background:${on ? "#7C3AED" : "transparent"};display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:12px">${on ? "✓" : ""}</span><span style="flex:1">${o.name}</span><span style="color:#5C5C69">+${eur(o.add)}</span></button>`; }).join("");
  };

  app.innerHTML = `
    <div class="v2-demo__split">
      <div class="v2-demo__main" style="background:radial-gradient(70% 60% at 50% 45%,#FFFFFF,#EEE9FA);padding:32px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;min-height:520px">
        <span id="cf-badge" style="position:absolute;top:18px;left:18px;font-size:12px;color:#5C5C69;border:1px solid #DDD6EE;border-radius:6px;padding:3px 8px;background:#fff"></span>
        <div id="cf-product"></div>
        <p class="v2-small">Vue de face · les changements s'appliquent en direct</p>
      </div>
      <div class="v2-demo__side" style="display:flex;flex-direction:column;gap:22px">
        <fieldset style="border:0;margin:0;padding:0"><legend style="font-weight:600;margin-bottom:10px">Couleur · <span id="cf-colorname" style="color:#5C5C69;font-weight:400"></span></legend><div id="cf-colors" style="display:flex;gap:10px;flex-wrap:wrap"></div></fieldset>
        <fieldset style="border:0;margin:0;padding:0"><legend style="font-weight:600;margin-bottom:10px">Matière</legend><div id="cf-mats" style="display:flex;flex-direction:column;gap:8px"></div></fieldset>
        <fieldset style="border:0;margin:0;padding:0"><legend style="font-weight:600;margin-bottom:10px">Options</legend><div id="cf-opts" style="display:flex;flex-direction:column;gap:8px"></div></fieldset>
        <div><label class="v2-label" for="cf-grav" style="font-weight:600;color:#14141A;font-size:15px">Gravure du badge <span class="v2-small">(+12 €, 8 caractères)</span></label><input class="v2-input" id="cf-grav" maxlength="8" placeholder="VOS INITIALES" style="text-transform:uppercase;letter-spacing:.1em"></div>
        <div style="border-top:1px solid #E7E2F3;padding-top:16px">
          <dl id="cf-lines" style="margin:0;display:grid;grid-template-columns:1fr auto;gap:6px 12px;font-size:14px;color:#5C5C69"></dl>
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:12px"><span style="font-weight:600">Total TTC</span><span id="cf-total" aria-live="polite" style="font-size:34px;letter-spacing:-.03em;color:#7C3AED;font-weight:600"></span></div>
          <p id="cf-delay" class="v2-small"></p>
        </div>
      </div>
    </div>`;

  app.addEventListener("click", (e) => {
    const t = e.target.closest("[data-color],[data-mat],[data-opt]");
    if (!t) return;
    if (t.dataset.color) { S.color = t.dataset.color; M.done("color"); }
    if (t.dataset.mat) { S.mat = t.dataset.mat; M.done("mat"); }
    if (t.dataset.opt) S.opts[t.dataset.opt] = !S.opts[t.dataset.opt];
    paintOptions(); paintProduct();
  });
  $("#cf-grav").addEventListener("input", (e) => { S.engrave = e.target.value.slice(0, 8); if (S.engrave.trim()) M.done("engrave"); paintProduct(); });
  paintOptions(); paintProduct();
})();
