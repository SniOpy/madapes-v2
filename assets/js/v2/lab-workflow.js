/* Madapes Lab — AI Workflow Automation (simulation, aucun appel réseau) */
"use strict";

(function () {
  const { $, esc, missions } = window.MadapesV2;
  const app = $("#lab-app");
  if (!app) return;
  const M = missions("ai-workflow", ["toggle", "run", "lead"]);

  const NODES = [
    { id: "form", kind: "DÉCLENCHEUR", title: "Formulaire client", sub: "Demande de devis du site", x: 30, y: 160, fixed: true },
    { id: "ia", kind: "IA", title: "Qualification IA", sub: "Score, besoin, urgence", x: 260, y: 160, fixed: true },
    { id: "crm", kind: "CRM", title: "Fiche HubSpot", sub: "Contact + affaire créés", x: 500, y: 50 },
    { id: "slack", kind: "NOTIFICATION", title: "Alerte Slack", sub: "#commercial, à rappeler", x: 720, y: 50 },
    { id: "mail", kind: "E-MAIL", title: "Séquence nurturing", sub: "3 e-mails sur 10 jours", x: 500, y: 270 },
  ];
  const LEADS = {
    hot: { label: "Lead chaud", name: "Transports Martin", score: 82, need: "Gestion de flotte, 40 véhicules" },
    cold: { label: "Lead froid", name: "Camille, indépendante", score: 34, need: "Se renseigne sur les prix" },
  };
  const S = { lead: "hot", off: {}, status: {}, log: [], running: false, start: 0, elapsed: "" };
  let timers = [];

  const edge = (a, b) => {
    const A = NODES.find((n) => n.id === a), B = NODES.find((n) => n.id === b);
    const x1 = A.x + 180, y1 = A.y + 38, x2 = B.x, y2 = B.y + 38, mx = (x1 + x2) / 2;
    const active = (S.status[b] === "running" || S.status[b] === "done") && !S.off[b];
    return `<path d="M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}" fill="none" stroke="${active ? "#7C3AED" : "#CFC6E6"}" stroke-width="2" stroke-dasharray="${active ? "8 8" : "0"}">${S.status[b] === "running" ? '<animate attributeName="stroke-dashoffset" from="0" to="-16" dur=".8s" repeatCount="indefinite"/>' : ""}</path>`;
  };
  const LBL = { running: ["en cours", "#7C3AED"], done: ["ok", "#16a34a"], skipped: ["coupé", "#d97706"], off: ["non concerné", "#9A9AA8"] };

  const render = () => {
    app.innerHTML = `
      <div class="v2-demo__bar">
        <div role="group" aria-label="Lead de test" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <span class="v2-small">Lead de test :</span>
          ${Object.entries(LEADS).map(([k, l]) => `<button type="button" class="v2-chip" data-lead="${k}" aria-pressed="${S.lead === k}">${l.label} · ${l.score}</button>`).join("")}
        </div>
        <button type="button" class="v2-btn v2-btn--primary" data-act="run" ${S.running ? "disabled" : ""} style="margin-left:auto;padding:11px 18px;opacity:${S.running ? 0.6 : 1}">▶ ${S.running ? "Exécution…" : "Lancer l'automatisation"}</button>
      </div>
      <div class="v2-demo__split">
        <div class="v2-demo__main" style="overflow-x:auto">
          <div style="position:relative;width:920px;height:400px;margin:0 auto;background-image:radial-gradient(#DDD6EE 1px,transparent 1px);background-size:20px 20px">
            <svg viewBox="0 0 920 400" width="920" height="400" style="position:absolute;inset:0" aria-hidden="true">
              ${edge("form", "ia")}${edge("ia", "crm")}${edge("crm", "slack")}${edge("ia", "mail")}
              <text x="440" y="118" font-size="12" fill="#6B6B79" font-family="Poppins, sans-serif">score ≥ 60</text>
              <text x="440" y="300" font-size="12" fill="#6B6B79" font-family="Poppins, sans-serif">score &lt; 60</text>
            </svg>
            ${NODES.map((n) => {
              const st = S.status[n.id], off = !!S.off[n.id];
              const lbl = off ? ["coupé", "#d97706"] : st ? LBL[st] : [n.fixed ? "fixe" : "actif", "#6B6B79"];
              return `<button type="button" data-node="${n.id}" aria-pressed="${!off}" aria-label="${esc(n.title)}${n.fixed ? "" : off ? ", coupé, cliquer pour réactiver" : ", actif, cliquer pour couper"}" style="position:absolute;left:${n.x}px;top:${n.y}px;width:180px;text-align:left;cursor:${n.fixed ? "default" : "pointer"};color:#14141A;background:${st === "running" ? "rgba(124,58,237,.10)" : "#fff"};border:1.5px solid ${st === "running" ? "#7C3AED" : st === "done" ? "#16a34a" : "#DDD6EE"};border-radius:14px;padding:12px 14px;opacity:${off || st === "off" ? 0.45 : 1};box-shadow:${st === "running" ? "0 0 0 6px rgba(124,58,237,.12)" : "0 4px 14px -8px rgba(20,20,26,.25)"}">
                <span style="display:flex;justify-content:space-between;font-size:11.5px;color:#6B6B79"><span>${n.kind}</span><span style="color:${lbl[1]}">${lbl[0]}</span></span>
                <span style="display:block;margin-top:4px;font-weight:600;font-size:15px">${n.title}</span>
                <span style="display:block;margin-top:2px;font-size:12.5px;color:#5C5C69">${n.sub}</span>
              </button>`;
            }).join("")}
          </div>
        </div>
        <aside class="v2-demo__side">
          <p style="font-weight:600;margin-bottom:10px">Journal d'exécution</p>
          ${S.log.length ? "" : '<p class="v2-small">Cliquez sur « Lancer l\'automatisation ». Cliquez sur un bloc pour le couper ou le réactiver.</p>'}
          <ol aria-live="polite" style="display:flex;flex-direction:column;gap:8px">${S.log.map((l) => `<li style="border:1px solid #E7E2F3;border-radius:10px;padding:9px 12px;font-size:13.5px"><span class="v2-small" style="margin-right:6px">${l.t}</span><span style="color:${l.c}">●</span> ${esc(l.text)}</li>`).join("")}</ol>
          ${S.elapsed && !S.running ? `<p style="margin-top:14px;font-size:14px;border:1px solid #7C3AED;border-radius:10px;padding:10px 12px">Lead traité en ${S.elapsed}, sans aucune saisie manuelle.</p>` : ""}
        </aside>
      </div>`;
  };

  const run = () => {
    if (S.running) return;
    timers.forEach(clearTimeout); timers = [];
    const L = LEADS[S.lead], hot = L.score >= 60;
    const plan = [["form", `Nouvelle demande : ${L.name}`], ["ia", `IA : score ${L.score}/100 · ${L.need}`]];
    if (hot) {
      plan.push(S.off.crm ? ["crm", "Bloc CRM coupé : étape ignorée", true] : ["crm", "HubSpot : contact et affaire créés"]);
      plan.push(S.off.slack ? ["slack", "Bloc Slack coupé : personne n'est prévenu", true] : ["slack", `Slack : « ${L.name} à rappeler sous 1 h »`]);
    } else plan.push(S.off.mail ? ["mail", "Bloc e-mail coupé : le lead est perdu", true] : ["mail", "Séquence nurturing lancée (3 e-mails)"]);
    Object.assign(S, { running: true, status: {}, log: [], start: Date.now(), elapsed: "" });
    M.done("run");
    render();
    const secs = () => ((Date.now() - S.start) / 1000).toFixed(1).replace(".", ",") + " s";
    plan.forEach(([id, text, skip], i) => {
      timers.push(setTimeout(() => { S.status[id] = skip ? "skipped" : "running"; render(); }, 150 + i * 750));
      timers.push(setTimeout(() => {
        S.status[id] = skip ? "skipped" : "done";
        S.log.push({ t: secs(), text, c: skip ? "#d97706" : "#16a34a" });
        if (i === plan.length - 1) { S.running = false; S.elapsed = secs(); }
        render();
      }, 650 + i * 750));
    });
    timers.push(setTimeout(() => { (hot ? ["mail"] : ["crm", "slack"]).forEach((k) => (S.status[k] = "off")); render(); }, 900));
  };

  app.addEventListener("click", (e) => {
    const t = e.target.closest("[data-lead],[data-node],[data-act]");
    if (!t || S.running) return;
    if (t.dataset.lead) { S.lead = t.dataset.lead; S.status = {}; S.log = []; S.elapsed = ""; if (S.lead !== "hot") M.done("lead"); }
    if (t.dataset.node) { const n = NODES.find((x) => x.id === t.dataset.node); if (n.fixed) return; S.off[n.id] = !S.off[n.id]; M.done("toggle"); }
    if (t.dataset.act === "run") return run();
    render();
  });
  render();
})();
