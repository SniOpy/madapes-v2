/* Madapes Lab — Smart Fleet (géolocalisation de flotte, données simulées) */
"use strict";

(function () {
  const { $, esc, reduceMotion, missions } = window.MadapesV2;
  const app = $("#lab-app");
  if (!app) return;
  const M = missions("smart-fleet", ["filter", "inspect", "alert"]);

  const ST = {
    moving: { label: "En route", color: "#3DDC97" },
    parked: { label: "Stationné", color: "#9A9AA8" },
    maintenance: { label: "Maintenance", color: "#F59E0B" },
    breakdown: { label: "En panne", color: "#FF5A5F" },
  };
  const ROADS = [
    { name: "Quai de Bercy", major: true, pts: [[0, 205], [140, 222], [250, 268], [370, 300], [520, 330], [610, 380], [700, 440], [860, 520], [1000, 575]] },
    { name: "Boulevard Périphérique", major: true, pts: [[40, 0], [70, 120], [120, 200], [190, 300], [300, 360], [450, 420], [560, 470], [640, 560], [680, 640]] },
    { name: "A86", major: true, pts: [[0, 600], [180, 560], [330, 540], [470, 560], [620, 600], [780, 610], [1000, 630]] },
    { name: "Avenue de la République", major: false, pts: [[300, 640], [310, 520], [330, 430], [360, 340], [400, 220], [430, 90], [440, 0]] },
    { name: "Rue de Paris", major: false, pts: [[540, 0], [550, 120], [565, 240], [580, 350], [600, 460]] },
    { name: "Avenue du Général Leclerc", major: false, pts: [[700, 640], [720, 520], [760, 400], [820, 280], [880, 160], [930, 0]] },
    { name: "Route de Choisy", major: false, pts: [[100, 640], [150, 520], [210, 430], [250, 330], [270, 250]] },
    { name: "Rue Victor Hugo", major: false, pts: [[600, 460], [680, 470], [760, 400], [880, 360], [1000, 350]] },
    { name: "Boulevard de Stalingrad", major: false, pts: [[150, 520], [300, 500], [420, 500], [540, 520], [640, 560]] },
  ];
  ROADS.forEach((r) => {
    r.cum = [0];
    for (let i = 1; i < r.pts.length; i++) r.cum.push(r.cum[i - 1] + Math.hypot(r.pts[i][0] - r.pts[i - 1][0], r.pts[i][1] - r.pts[i - 1][1]));
    r.len = r.cum[r.cum.length - 1];
  });
  const at = (road, d) => {
    d = Math.max(0, Math.min(road.len, d));
    for (let i = 1; i < road.pts.length; i++) {
      if (d <= road.cum[i]) {
        const f = (d - road.cum[i - 1]) / (road.cum[i] - road.cum[i - 1] || 1), a = road.pts[i - 1], b = road.pts[i];
        return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f, ang: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI + 90 };
      }
    }
    const p = road.pts[road.pts.length - 1];
    return { x: p[0], y: p[1], ang: 0 };
  };
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const STOPS = ["Client — Ivry, rue Molière", "Chantier — Charenton, quai des Carrières", "Client — Alfortville, rue Véron", "Client — Créteil, av. de Verdun", "Retour dépôt"];

  const init = () => {
    const r = rng(7), L = "ABCDEFGHJKLMNPRSTVWXYZ";
    return ["Inès M.", "Karim B.", "Sofia L.", "Lucas D.", "Nadia R.", "Hugo P.", "Yanis T.", "Léa G.", "Omar S.", "Chloé V.", "Sami K.", "Jade F."].map((driver, i) => {
      const status = i === 3 || i === 9 ? "parked" : i === 7 ? "maintenance" : "moving", road = i % ROADS.length;
      const plate = `${L[Math.floor(r() * 22)]}${L[Math.floor(r() * 22)]}-${100 + Math.floor(r() * 900)}-${L[Math.floor(r() * 22)]}${L[Math.floor(r() * 22)]}`;
      return { id: `VH-${101 + i}`, driver, model: ["Renault Master", "Peugeot Boxer", "Iveco Daily", "Renault Trafic"][i % 4], plate, status, road, d: r() * ROADS[road].len, dir: r() > 0.5 ? 1 : -1, speed: status === "moving" ? 28 + Math.round(r() * 40) : 0, fuel: 35 + Math.round(r() * 60), km: 12000 + Math.round(r() * 80000), today: 20 + Math.round(r() * 90), stop: 1 + (i % 3) };
    });
  };
  const S = { v: init(), filter: "all", sel: null, trail: [], zoom: 1, log: [] };

  /* ---------- Squelette ---------- */
  const roadsSvg = ROADS.map((r) => {
    const d = "M" + r.pts.map((p) => p.join(" ")).join(" L");
    return `<path d="${d}" fill="none" stroke="${r.major ? "#B9A2EE" : "#D3D6DF"}" stroke-width="${r.major ? 11 : 7.5}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${r.major ? "#F5EEFF" : "#FFFFFF"}" stroke-width="${r.major ? 7 : 4.5}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join("");
  app.innerHTML = `
    <div class="v2-demo__bar">
      <div style="display:flex;gap:28px;flex-wrap:wrap" id="fl-kpis"></div>
      <div role="toolbar" aria-label="Filtrer par statut" style="display:flex;flex-wrap:wrap;gap:6px;margin-left:auto" id="fl-filters"></div>
    </div>
    <div class="v2-demo__split">
      <div class="v2-demo__main" style="background:#E6E8EE">
        <svg id="fl-map" viewBox="0 0 1000 640" style="display:block;width:100%;height:auto;aspect-ratio:1000/640;transition:all .5s" role="img" aria-label="Carte de la flotte, Est parisien (fond de carte simulé)">
          <defs>
            <pattern id="fl-b1" width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(-18)"><rect width="34" height="34" fill="#E6E8EE"/><rect x="3" y="3" width="28" height="28" rx="3" fill="#F6F7FA"/></pattern>
            <pattern id="fl-b2" width="26" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(12)"><rect width="26" height="40" fill="#E6E8EE"/><rect x="3" y="3" width="20" height="34" rx="3" fill="#F3F4F8"/></pattern>
          </defs>
          <rect width="1000" height="640" fill="url(#fl-b1)"/>
          <path d="M0 330 L380 340 L640 470 L1000 620 L1000 640 L0 640 Z" fill="url(#fl-b2)"/>
          <path d="M640 0 L1000 0 L1000 210 C 920 240, 820 230, 760 180 C 700 140, 660 80, 640 0 Z" fill="#CFE8D5"/>
          <path d="M120 400 C 160 380, 210 390, 220 430 C 230 470, 170 490, 130 470 C 100 455, 95 415, 120 400 Z" fill="#CFE8D5"/>
          <path d="M840 470 C 880 450, 940 460, 950 500 C 955 535, 900 550, 860 535 C 830 520, 820 490, 840 470 Z" fill="#CFE8D5"/>
          <path d="M0 238 C 140 250, 250 300, 370 322 S 560 360, 640 440 S 820 570, 1000 610" fill="none" stroke="#B9D4EF" stroke-width="30"/>
          <path d="M640 440 C 700 400, 760 380, 840 400 S 960 430, 1000 410" fill="none" stroke="#B9D4EF" stroke-width="18"/>
          <g stroke="#FFFFFF" stroke-width="3" fill="none"><path d="M40 0 L80 230"/><path d="M180 0 L230 250"/><path d="M300 0 L330 300"/><path d="M420 40 L450 330"/><path d="M0 70 L520 140"/><path d="M0 150 L440 200"/><path d="M60 330 L40 640"/><path d="M160 340 L120 640"/><path d="M450 360 L380 640"/><path d="M0 420 L300 400"/><path d="M0 580 L330 560"/><path d="M480 600 L700 520"/><path d="M600 100 L640 300"/><path d="M700 260 L980 300"/><path d="M760 470 L740 640"/><path d="M880 330 L960 640"/><path d="M560 200 L700 230"/></g>
          ${roadsSvg}
          <g font-family="Poppins, sans-serif" font-size="11" fill="#6B6B79" letter-spacing="2">
            <text x="250" y="95">PARIS 12E</text><text x="200" y="285">BERCY</text><text x="540" y="200">CHARENTON-LE-PONT</text><text x="770" y="80" fill="#3E7A52">BOIS DE VINCENNES</text>
            <text x="200" y="545">IVRY-SUR-SEINE</text><text x="40" y="625">VITRY-SUR-SEINE</text><text x="600" y="505">ALFORTVILLE</text><text x="720" y="330">MAISONS-ALFORT</text><text x="860" y="590">CRÉTEIL</text>
            <text x="430" y="352" fill="#3B6FA0" letter-spacing="4" font-style="italic">La Seine</text><text x="880" y="400" fill="#3B6FA0" letter-spacing="4" font-style="italic">La Marne</text>
          </g>
          <circle cx="420" cy="500" r="54" fill="rgba(124,58,237,0.08)" stroke="#A855F7" stroke-width="1.2" stroke-dasharray="5 5"/>
          <g transform="translate(420 500)"><rect x="-11" y="-11" width="22" height="22" rx="6" fill="#7C3AED"/><path d="M-5 3 V-2 L0 -6 L5 -2 V3 Z" fill="#fff"/></g>
          <text x="440" y="470" font-family="Poppins, sans-serif" font-size="11" font-weight="600" fill="#5B21B6">Dépôt · zone 1 km</text>
          <polyline id="fl-trail" points="" fill="none" stroke="#A855F7" stroke-width="3" stroke-opacity=".75" stroke-linecap="round" stroke-linejoin="round"/>
          <g id="fl-stop"></g>
          <g id="fl-vehicles"></g>
        </svg>
        <div class="v2-maptools">
          <button type="button" data-act="zin" aria-label="Zoomer">+</button>
          <button type="button" data-act="zout" aria-label="Dézoomer">−</button>
          <button type="button" data-act="reset" aria-label="Vue d'ensemble">⤢</button>
        </div>
        <div class="v2-maplive"><span class="v2-dot" style="background:#3DDC97"></span>Direct<span id="fl-clock" style="color:#6B6B79"></span></div>
        <ol class="v2-log" id="fl-log" aria-live="polite"></ol>
      </div>
      <aside class="v2-demo__side" id="fl-side"></aside>
    </div>`;

  /* ---------- Rendu ---------- */
  const counts = () => S.v.reduce((c, v) => ((c[v.status] = (c[v.status] || 0) + 1), c), { moving: 0, parked: 0, maintenance: 0, breakdown: 0 });
  const visible = () => S.v.filter((v) => S.filter === "all" || v.status === S.filter || v.id === S.sel);
  const sel = () => S.v.find((v) => v.id === S.sel) || null;

  const paintBar = () => {
    const c = counts(), mv = S.v.filter((v) => v.status === "moving");
    const avg = mv.length ? Math.round(mv.reduce((a, v) => a + v.speed, 0) / mv.length) : 0, al = c.maintenance + c.breakdown;
    $("#fl-kpis").innerHTML = `<p class="v2-kpi">En tournée<b>${c.moving}/${S.v.length}</b></p><p class="v2-kpi">Vitesse moy.<b>${avg} km/h</b></p><p class="v2-kpi">Km aujourd'hui<b>${Math.round(S.v.reduce((a, v) => a + v.today, 0)).toLocaleString("fr-FR")}</b></p><p class="v2-kpi">Alertes<b style="color:${al ? "#F59E0B" : "inherit"}">${al}</b></p>`;
    $("#fl-filters").innerHTML = ["all", "moving", "parked", "maintenance", "breakdown"].map((f) => `<button type="button" class="v2-chip" data-filter="${f}" aria-pressed="${S.filter === f}"><span class="v2-dot" style="background:${f === "all" ? "#A855F7" : ST[f].color}"></span>${f === "all" ? "Tous" : ST[f].label}<span style="opacity:.6">${f === "all" ? S.v.length : c[f]}</span></button>`).join("");
  };

  const paintMap = () => {
    const sv = sel(), sp = sv ? at(ROADS[sv.road], sv.d) : null;
    const w = 1000 / S.zoom, h = 640 / S.zoom;
    const x0 = Math.max(0, Math.min(1000 - w, (sp ? sp.x : 500) - w / 2)), y0 = Math.max(0, Math.min(640 - h, (sp ? sp.y : 320) - h / 2));
    $("#fl-map").setAttribute("viewBox", `${x0.toFixed(1)} ${y0.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
    const k = (1 / Math.sqrt(S.zoom)).toFixed(2);
    $("#fl-vehicles").innerHTML = visible().map((v) => {
      const p = at(ROADS[v.road], v.d), on = v.id === S.sel, col = ST[v.status].color, alarm = v.status === "maintenance" || v.status === "breakdown";
      return `<g transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${k})" data-veh="${v.id}" style="cursor:pointer">
        ${alarm && !reduceMotion ? `<circle class="v2-ring" r="9" fill="none" stroke="${col}" stroke-width="2"/>` : ""}
        <circle r="${on ? 16 : 11}" fill="${col}" fill-opacity=".18"/>
        <g transform="rotate(${(v.dir > 0 ? p.ang : p.ang + 180).toFixed(0)})"><path d="M0 -10 L7 8 L0 4 L-7 8 Z" fill="${col}" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></g>
        <g transform="translate(12 -14)"><rect y="-9" width="46" height="16" rx="4" fill="${on ? "#A855F7" : "rgba(255,255,255,.95)"}" stroke="${on ? "none" : "#DDD6EE"}"/><text x="5" y="3" font-family="Poppins, sans-serif" font-size="9.5" font-weight="600" fill="${on ? "#fff" : "#14141A"}">${v.id}</text></g>
      </g>`;
    }).join("");
    $("#fl-trail").setAttribute("points", S.trail.map((p) => p.map((n) => n.toFixed(1)).join(",")).join(" "));
    if (sv) {
      const r = ROADS[(sv.road + 3) % ROADS.length], q = at(r, r.len * 0.6);
      $("#fl-stop").innerHTML = `<g transform="translate(${q.x.toFixed(1)} ${q.y.toFixed(1)}) scale(${k})"><path d="M0 0 C -9 -12, -9 -22, 0 -24 C 9 -22, 9 -12, 0 0 Z" fill="#7C3AED"/><circle cy="-16" r="3.5" fill="#fff"/></g>`;
    } else $("#fl-stop").innerHTML = "";
    $("#fl-clock").textContent = " · " + new Date().toLocaleTimeString("fr-FR");
  };

  const paintSide = () => {
    const sv = sel(), side = $("#fl-side");
    if (!sv) {
      side.innerHTML = `<p class="v2-small" style="text-transform:uppercase;letter-spacing:.12em;margin-bottom:10px">${visible().length} véhicule(s) · cliquez pour suivre</p>
        <ul style="max-height:560px;overflow:auto">${visible().map((v) => `<li><button type="button" class="v2-listbtn" data-pick="${v.id}"><span class="v2-dot" style="background:${ST[v.status].color}"></span><span style="flex:1;min-width:0"><b style="display:block;font-weight:600">${v.id} · ${esc(v.driver)}</b><span class="v2-small" style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${ST[v.status].label} · ${ROADS[v.road].name}</span></span><span style="color:#5C5C69">${v.speed} km/h</span></button></li>`).join("")}</ul>`;
      return;
    }
    const p = at(ROADS[sv.road], sv.d), ok = sv.status === "moving" || sv.status === "parked";
    const base = new Date(); base.setHours(8, 30, 0, 0);
    const stops = STOPS.map((name, i) => {
      const t = new Date(base.getTime() + i * 75 * 60000).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      const done = i < sv.stop, cur = i === sv.stop;
      const info = done ? "Intervention terminée" : cur ? (sv.status === "moving" ? `En approche · arrivée estimée ${Math.max(3, Math.round(18 - sv.speed / 6))} min` : "En attente") : "Prévu";
      return `<li style="display:flex;gap:12px;padding:6px 0"><span style="width:12px;height:12px;margin-top:4px;border-radius:50%;flex:none;background:${done ? "#7C3AED" : cur ? "#fff" : "transparent"};border:2px solid ${done ? "#7C3AED" : cur ? "#A855F7" : "#C9C2DD"}"></span><span style="flex:1"><span style="display:block;font-size:13.5px;color:${done ? "#6B6B79" : "#14141A"}">${name}</span><span class="v2-small" style="display:block">${info}</span></span><span style="font-size:12.5px">${t}</span></li>`;
    }).join("");
    side.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px">
        <div><p class="v2-small">${sv.model} · ${sv.plate}</p><h2 style="font-size:24px;letter-spacing:-.02em">${sv.id}</h2><p style="font-size:14px;color:#5C5C69">${esc(sv.driver)} · <span style="color:${ST[sv.status].color}">${ST[sv.status].label}</span></p></div>
        <button type="button" data-act="close" aria-label="Fermer la fiche" style="background:none;border:0;font-size:22px;cursor:pointer;color:#6B6B79">×</button>
      </div>
      <div style="margin-top:14px;background:#F8F7FC;border:1px solid #E7E2F3;border-radius:12px;padding:12px 14px"><p class="v2-small">Position actuelle</p><p style="font-weight:500">${ROADS[sv.road].name}</p><p class="v2-small">${(48.86 - p.y * 0.00009).toFixed(5)} N, ${(2.36 + p.x * 0.00012).toFixed(5)} E</p></div>
      <dl style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:10px 0 0">
        <div class="v2-card"><dt>Vitesse</dt><dd>${sv.speed} km/h</dd></div><div class="v2-card"><dt>Carburant</dt><dd>${Math.round(sv.fuel)} %</dd></div><div class="v2-card"><dt>Compteur</dt><dd>${Math.round(sv.km).toLocaleString("fr-FR")}</dd></div>
      </dl>
      <p class="v2-small" style="margin:16px 0 8px;text-transform:uppercase;letter-spacing:.12em">Tournée du jour</p>
      <ol>${stops}</ol>
      ${ok ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px"><button type="button" class="v2-btn-line" style="border:1px solid #F59E0B" data-act="maint">Alerte maintenance</button><button type="button" class="v2-btn-line" style="border:1px solid #FF5A5F" data-act="break">Simuler une panne</button></div>`
        : `<button type="button" class="v2-btn-line" style="border:1px solid #3DDC97;margin-top:14px" data-act="resolve">Clôturer l'intervention</button>`}`;
  };

  const log = (color, text) => {
    S.log = [{ at: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), color, text }, ...S.log].slice(0, 3);
    $("#fl-log").innerHTML = S.log.map((l) => `<li style="border-left:3px solid ${l.color}"><span class="v2-small" style="margin-right:8px">${l.at}</span>${esc(l.text)}</li>`).join("");
  };
  const setStatus = (status, speed, color, text, isAlert) => {
    const sv = sel(); if (!sv) return;
    sv.status = status; sv.speed = speed;
    log(color, text);
    if (isAlert) M.done("alert");
    paintAll();
  };
  const paintAll = () => { paintBar(); paintMap(); paintSide(); };

  /* ---------- Événements ---------- */
  app.addEventListener("click", (e) => {
    const t = e.target.closest("[data-filter],[data-pick],[data-veh],[data-act]");
    if (!t) return;
    if (t.dataset.filter) { S.filter = t.dataset.filter; if (S.filter !== "all") M.done("filter"); }
    const pick = t.dataset.pick || t.dataset.veh;
    if (pick) { S.sel = pick; S.trail = []; S.zoom = Math.max(S.zoom, 2); M.done("inspect"); }
    const a = t.dataset.act, sv = sel();
    if (a === "zin") S.zoom = Math.min(3, S.zoom * 1.5);
    if (a === "zout") S.zoom = Math.max(1, S.zoom / 1.5);
    if (a === "reset" || a === "close") { S.zoom = 1; S.sel = null; S.trail = []; }
    if (a === "maint" && sv) return setStatus("maintenance", 0, "#F59E0B", `${sv.id} · vidange à prévoir sous 500 km`, true);
    if (a === "break" && sv) return setStatus("breakdown", 0, "#FF5A5F", `${sv.id} · arrêt moteur sur ${ROADS[sv.road].name}, ${sv.driver} prévenu(e)`, true);
    if (a === "resolve" && sv) return setStatus("moving", 35, "#3DDC97", `${sv.id} · remis en circulation`, false);
    paintAll();
  });

  /* ---------- Simulation ---------- */
  paintAll();
  if (!reduceMotion) {
    let n = 0;
    setInterval(() => {
      S.v.forEach((v) => {
        if (v.status !== "moving") return;
        const road = ROADS[v.road];
        v.d += v.dir * v.speed * 0.012;
        if (v.d >= road.len) { v.d = road.len; v.dir = -1; }
        if (v.d <= 0) { v.d = 0; v.dir = 1; }
        v.km += v.speed / 36000; v.today += v.speed / 36000; v.fuel = Math.max(5, v.fuel - 0.002);
        v.speed = Math.max(15, Math.min(road.major ? 90 : 50, v.speed + (Math.random() < 0.5 ? -1 : 1)));
      });
      const sv = sel();
      if (sv) {
        const p = at(ROADS[sv.road], sv.d), last = S.trail[S.trail.length - 1];
        if (!last || Math.abs(last[0] - p.x) + Math.abs(last[1] - p.y) > 2) S.trail = [...S.trail, [p.x, p.y]].slice(-80);
      }
      paintMap();
      if (++n % 10 === 0) { paintBar(); paintSide(); }
    }, 100);
  }
})();
