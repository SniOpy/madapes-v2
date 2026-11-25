/* Madapes V2 — chorégraphie « spectacle » de l'accueil (GSAP + ScrollTrigger + Lenis + WebGL).
   - Preloader (1re visite de la session) puis rideau.
   - Fond « aurore » WebGL réactif à la souris (hero + grand CTA).
   - Titres révélés mot à mot en 3D, compteurs, bandeaux croisés liés à la vitesse du scroll.
   - Services en scroll horizontal épinglé, Méthode épinglée, sections qui s'empilent.
   - Curseur personnalisé, boutons magnétiques, inclinaison 3D.
   Tout est désactivé si prefers-reduced-motion ou si GSAP n'a pas pu se charger. */
"use strict";

(function () {
  const root = document.documentElement;
  const V2 = window.MadapesV2;
  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  if (!V2 || !V2.canAnimate() || !ST || !document.querySelector(".v2-hero")) {
    root.classList.remove("v2-motion", "v2-preload");
    return;
  }
  const { $, $$, splitWords } = V2;
  gsap.registerPlugin(ST);

  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const EASE = "expo.out";
  const mm = gsap.matchMedia();
  const DESKTOP = "(min-width: 1024px) and (min-height: 640px)";

  /* ======================================================================
     AURORE WebGL — bruit fractal violet, lumière qui suit la souris
     ====================================================================== */
  const FRAG = `
    precision highp float;
    uniform vec2 r; uniform float t; uniform vec2 m; uniform float mode;
    vec2 h2(vec2 p){ p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3))); return -1.0 + 2.0*fract(sin(p)*43758.5453); }
    float n(vec2 p){
      vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
      return mix(mix(dot(h2(i),f), dot(h2(i+vec2(1,0)),f-vec2(1,0)), u.x),
                 mix(dot(h2(i+vec2(0,1)),f-vec2(0,1)), dot(h2(i+vec2(1,1)),f-vec2(1,1)), u.x), u.y);
    }
    float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a*n(p); p = p*2.03 + 7.1; a *= 0.5; } return v; }
    void main(){
      vec2 uv = gl_FragCoord.xy / r; float ar = r.x / r.y;
      vec2 p = vec2(uv.x*ar, uv.y); vec2 mp = vec2(m.x*ar, m.y);
      float d = length(p - mp);
      vec2 q = vec2(fbm(p*1.3 + vec2(0.0, t*0.06)), fbm(p*1.3 + vec2(5.2, 1.3) - t*0.05));
      vec2 w = q*2.4 + (mp - p)*0.35*exp(-d*2.2);
      float f = fbm(p*1.6 + w + t*0.025) * 0.5 + 0.5;
      vec3 bg = vec3(0.043, 0.043, 0.051);
      vec3 c1 = vec3(0.486, 0.227, 0.929), c2 = vec3(0.659, 0.333, 0.969), c3 = vec3(0.843, 0.741, 1.0);
      vec3 col = mix(bg, c1*0.85, smoothstep(0.42, 0.78, f));
      col = mix(col, c2, smoothstep(0.62, 0.9, f)*0.6);
      col += c3 * pow(smoothstep(0.72, 1.0, f), 3.0) * 0.55;
      col += c2 * 0.22 * exp(-d*3.2);
      if (mode < 0.5) {
        col *= 0.25 + 0.75*smoothstep(0.0, 1.1, uv.y*0.7 + uv.x*0.75);
      } else {
        col *= 0.2 + 0.8*smoothstep(1.3, 0.0, length(uv - vec2(0.85, 0.15))*1.4);
      }
      float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + t) * 43758.5453);
      col += (g - 0.5) * 0.025;
      gl_FragColor = vec4(col, 1.0);
    }`;
  const aurora = (canvas, mode) => {
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    const vs = sh(gl.VERTEX_SHADER, "attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }");
    const fs = sh(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = { r: gl.getUniformLocation(prog, "r"), t: gl.getUniformLocation(prog, "t"), m: gl.getUniformLocation(prog, "m"), mode: gl.getUniformLocation(prog, "mode") };
    gl.uniform1f(U.mode, mode);
    const scale = Math.min(window.devicePixelRatio || 1, 2) * 0.5; /* demi-résolution : flou naturel + perf */
    const resize = () => {
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * scale));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(U.r, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);
    const mouse = { x: mode < 0.5 ? 0.75 : 0.8, y: mode < 0.5 ? 0.7 : 0.25 };
    const target = { ...mouse };
    if (finePointer) {
      canvas.parentElement.addEventListener("pointermove", (e) => {
        const b = canvas.getBoundingClientRect();
        target.x = (e.clientX - b.left) / b.width;
        target.y = 1 - (e.clientY - b.top) / b.height;
      });
    }
    let visible = false;
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);
    const t0 = performance.now();
    gsap.ticker.add(() => {
      if (!visible || document.hidden) return;
      mouse.x += (target.x - mouse.x) * 0.05;
      mouse.y += (target.y - mouse.y) * 0.05;
      gl.uniform1f(U.t, (performance.now() - t0) / 1000);
      gl.uniform2f(U.m, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });
    canvas.classList.add("is-on");
  };
  aurora($(".v2-hero .v2-aurora"), 0);
  aurora($(".v2-bigcta .v2-aurora"), 1);

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis && finePointer) {
    lenis = new window.Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on("scroll", ST.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href*="#"]');
      if (!a) return;
      const url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname || !url.hash) return;
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;
      e.preventDefault();
      const header = $(".site-header");
      lenis.scrollTo(target, { offset: -((header && header.offsetHeight) || 0) });
      history.pushState(null, "", url.hash);
    });
  }
  const scrollToY = (y) => (lenis ? lenis.scrollTo(y, { duration: 1 }) : window.scrollTo({ top: y, behavior: "smooth" }));

  /* ---------- Barre de progression ---------- */
  const bar = document.createElement("div");
  bar.className = "v2-progressbar";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  gsap.to(bar, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

  /* ---------- Compteur générique (« -28% », « 1,8s », « 1 990 € ») ---------- */
  const countUp = (el, opts = {}) => {
    if (!el) return null;
    const raw = el.textContent.trim();
    const m = raw.match(/^([^\d]*)([\d\s  ]*\d(?:[.,]\d+)?)(.*)$/);
    if (!m) return null;
    const [, pre, num, post] = m;
    const grouped = /[\s  ]/.test(num);
    const clean = num.replace(/[\s  ]/g, "");
    const decimals = (clean.split(/[.,]/)[1] || "").length;
    const sep = clean.includes(",") ? "," : ".";
    const target = parseFloat(clean.replace(",", "."));
    const fmt = (v) => (grouped ? Math.round(v).toLocaleString("fr-FR").replace(/[  ]/g, " ") : v.toFixed(decimals).replace(".", sep));
    const o = { v: 0 };
    return gsap.to(o, {
      v: target, duration: 1.8, ease: EASE, ...opts,
      onUpdate: () => (el.textContent = pre + fmt(o.v) + post),
      onComplete: () => (el.textContent = raw),
    });
  };

  /* ======================================================================
     HERO — états initiaux (avant le 1er rendu visible)
     ====================================================================== */
  const hero = $(".v2-hero");
  const h1Words = splitWords($("#hero-title"));
  const proof = $(".v2-hero__proof");
  if (proof) {
    Array.from(proof.childNodes).forEach((n) => {
      if (n.nodeType === 3 && n.textContent.trim()) {
        const s = document.createElement("span");
        s.className = "v2-pi";
        s.textContent = n.textContent;
        n.replaceWith(s);
      }
    });
  }
  const consoleEl = $(".v2-console");
  const heroEyebrow = $(".v2-hero .v2-eyebrow");
  const bars = $$(".v2-console .v2-bars span");
  const bigStat = $("#panel-ads .v2-big");

  gsap.set(h1Words, { yPercent: 120, rotateX: -70, transformOrigin: "50% 100%", transformPerspective: 900 });
  gsap.set(heroEyebrow, { "--eb": 0, opacity: 0, x: -10 });
  gsap.set([".v2-hero__sub", ".v2-hero__ctas > *"], { y: 30, opacity: 0 });
  gsap.set(".v2-hero__proof > *", { y: 14, opacity: 0 });
  gsap.set(consoleEl, { y: 140, rotateX: 28, rotateY: -18, rotateZ: 4, opacity: 0, transformPerspective: 1400, transformOrigin: "50% 100%" });
  gsap.set(".v2-console .v2-tab", { y: 10, opacity: 0 });
  gsap.set(bars, { scaleY: 0, transformOrigin: "50% 100%" });
  gsap.set(".v2-badge", { scale: 0, rotate: -120 });
  gsap.set(".v2-scrollcue", { opacity: 0, y: 20 });

  const intro = gsap.timeline({ paused: true, defaults: { ease: EASE } });
  intro
    .to(heroEyebrow, { "--eb": 1, opacity: 1, x: 0, duration: 1 }, 0)
    .to(h1Words, { yPercent: 0, rotateX: 0, duration: 1.4, stagger: 0.055 }, 0.05)
    .to(".v2-hero__sub", { y: 0, opacity: 1, duration: 1.1 }, 0.75)
    .to(".v2-hero__ctas > *", { y: 0, opacity: 1, duration: 1, stagger: 0.08 }, 0.85)
    .to(".v2-hero__proof > *", { y: 0, opacity: 1, duration: 0.9, stagger: 0.035 }, 1)
    .to(consoleEl, { y: 0, rotateX: 0, rotateY: 0, rotateZ: 0, opacity: 1, duration: 1.8 }, 0.55)
    .to(".v2-console .v2-tab", { y: 0, opacity: 1, duration: 0.8, stagger: 0.06 }, 1.05)
    .to(bars, { scaleY: 1, duration: 1.3, stagger: 0.06 }, 1.15)
    .add(() => countUp(bigStat), 1.15)
    .to(".v2-badge", { scale: 1, rotate: 0, duration: 1.6, ease: "elastic.out(1, 0.6)" }, 1.1)
    .to(".v2-scrollcue", { opacity: 1, y: 0, duration: 1 }, 1.5);

  root.classList.add("v2-motion-ready");

  /* ---------- Preloader (1re visite de la session) ---------- */
  if (root.classList.contains("v2-preload")) {
    const loader = document.createElement("div");
    loader.className = "v2-loader";
    loader.setAttribute("aria-hidden", "true");
    loader.innerHTML = `<div class="v2-loader__word"><span>Madapes</span> <span><em>agency</em></span></div>
      <div class="v2-loader__row"><span class="v2-loader__count">0</span><span class="v2-loader__label">Chargement</span></div>
      <div class="v2-loader__bar"><i></i></div>`;
    document.body.appendChild(loader);
    root.classList.remove("v2-preload");
    if (lenis) lenis.stop();
    const count = $(".v2-loader__count", loader);
    const o = { v: 0 };
    gsap.timeline({
      onComplete: () => {
        loader.remove();
        if (lenis) lenis.start();
        try { sessionStorage.setItem("v2-loaded", "1"); } catch (e) { /* ignore */ }
      },
    })
      .from($$(".v2-loader__word span", loader), { yPercent: 110, duration: 0.9, stagger: 0.08, ease: EASE }, 0)
      .to(o, { v: 100, duration: 1.4, ease: "power3.inOut", onUpdate: () => (count.textContent = Math.round(o.v)) }, 0)
      .to($(".v2-loader__bar i", loader), { scaleX: 1, duration: 1.4, ease: "power3.inOut" }, 0)
      .to($$(".v2-loader__word span, .v2-loader__row", loader), { yPercent: -110, opacity: 0, duration: 0.5, stagger: 0.04, ease: "power3.in" }, 1.45)
      .to(loader, { clipPath: "inset(0% 0% 100% 0%)", duration: 1.1, ease: "expo.inOut" }, 1.75)
      .add(() => intro.play(), 2.1);
  } else {
    gsap.delayedCall(0.1, () => intro.play());
  }

  /* Parallaxe de sortie du hero */
  gsap.to(".v2-hero__grid", { yPercent: 18, scale: 0.94, opacity: 0.2, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".v2-badge", { yPercent: -160, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });

  if (finePointer) {
    const rx = gsap.quickTo(consoleEl, "rotateX", { duration: 0.9, ease: "power3.out" });
    const ry = gsap.quickTo(consoleEl, "rotateY", { duration: 0.9, ease: "power3.out" });
    consoleEl.addEventListener("pointermove", (e) => {
      if (intro.isActive()) return;
      const r = consoleEl.getBoundingClientRect();
      rx(-((e.clientY - r.top) / r.height - 0.5) * 8);
      ry(((e.clientX - r.left) / r.width - 0.5) * 10);
    });
    consoleEl.addEventListener("pointerleave", () => { rx(0); ry(0); });
  }

  /* Indicateur glissant sous les onglets (console + offres). */
  const ink = (list, cls) => {
    if (!list) return null;
    const el = document.createElement("span");
    el.className = cls;
    el.setAttribute("aria-hidden", "true");
    list.appendChild(el);
    const move = (instant) => {
      const sel = list.querySelector('[aria-selected="true"]');
      if (sel) gsap.to(el, { x: sel.offsetLeft, width: sel.offsetWidth, duration: instant ? 0 : 0.7, ease: EASE });
    };
    move(true);
    window.addEventListener("resize", () => move(true));
    if (document.fonts) document.fonts.ready.then(() => move(true));
    return move;
  };
  const moveTabInk = ink($(".v2-tabs"), "v2-tabs__ink");
  const movePlanInk = ink($(".v2-plantabs"), "v2-plantabs__ink");
  document.addEventListener("v2:tab", () => moveTabInk && moveTabInk());
  document.addEventListener("v2:plan", () => movePlanInk && movePlanInk());

  /* Les sections épinglées sont créées EN PREMIER : les déclencheurs suivants
     tiennent ainsi compte de l'espace ajouté par l'épinglage. */
  /* ======================================================================
     SERVICES — scroll horizontal épinglé (desktop)
     ====================================================================== */
  const services = $("#services");
  const cols = $$(".v2-col");
  if (services && cols.length) {
    const colKids = cols.flatMap((c) => Array.from(c.children));
    gsap.set(colKids, { y: 50, opacity: 0 });
    const countAll = () => cols.forEach((c, i) => gsap.delayedCall(0.15 + i * 0.12, () => countUp(c.querySelector(".v2-col__stat"), { duration: 2.2 })));
    ST.create({
      trigger: ".v2-cols",
      start: "top 85%",
      once: true,
      onEnter: () => {
        gsap.to(colKids, { y: 0, opacity: 1, duration: 1.2, stagger: 0.02, ease: EASE });
        countAll();
      },
    });

    mm.add(DESKTOP, () => {
      services.classList.add("v2-hs-on");
      const track = $(".v2-cols", services);
      const prog = document.createElement("div");
      prog.className = "v2-hs-progress";
      prog.setAttribute("aria-hidden", "true");
      prog.innerHTML = "<i></i>";
      services.appendChild(prog);
      const dist = () => Math.max(0, track.scrollWidth - (window.innerWidth - track.getBoundingClientRect().left) + 80);
      const tl = gsap.timeline({
        scrollTrigger: { trigger: services, start: "top top", end: () => "+=" + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 },
      });
      tl.to(track, { x: () => -dist(), ease: "none" }, 0).to($("i", prog), { scaleX: 1, ease: "none" }, 0);
      cols.forEach((c, i) => tl.fromTo(c, { rotate: 2 + i * 0.6, y: 30 + i * 12 }, { rotate: 0, y: 0, ease: "none" }, 0));
      return () => {
        services.classList.remove("v2-hs-on");
        prog.remove();
        gsap.set([track, ...cols], { clearProps: "transform" });
      };
    });
  }

  /* ======================================================================
     MÉTHODE — épinglée (desktop) : le scroll fait défiler les étapes
     ====================================================================== */
  const process = $("#process");
  if (process && window.MadapesHome) {
    const { setStep, stepCount } = window.MadapesHome;
    gsap.from(".v2-step", { y: 30, opacity: 0, duration: 0.9, stagger: 0.08, ease: EASE, scrollTrigger: { trigger: ".v2-stepper", start: "top 85%", once: true } });
    gsap.from(".v2-stepdetail", { y: 40, opacity: 0, duration: 1.1, ease: EASE, scrollTrigger: { trigger: ".v2-stepdetail", start: "top 90%", once: true } });

    mm.add(DESKTOP, () => {
      const hint = document.createElement("p");
      hint.className = "v2-pinhint";
      hint.textContent = "Faites défiler pour parcourir les étapes ↓";
      $(".v2-container", process).appendChild(hint);
      const st = ST.create({
        trigger: process,
        start: "top top",
        end: () => "+=" + window.innerHeight * 2.2,
        pin: true,
        anticipatePin: 1,
        onToggle: (self) => process.classList.toggle("v2-is-pinned", self.isActive),
        onUpdate: (self) => setStep(Math.min(stepCount - 1, Math.floor(self.progress * stepCount * 0.999))),
      });
      const onReq = (e) => {
        if (!st.isActive) return;
        e.preventDefault();
        scrollToY(st.start + ((e.detail.index + 0.5) / stepCount) * (st.end - st.start));
      };
      document.addEventListener("v2:step-request", onReq);
      return () => {
        document.removeEventListener("v2:step-request", onReq);
        hint.remove();
        process.classList.remove("v2-is-pinned");
      };
    });
  }

  /* ======================================================================
     BANDEAUX CROISÉS — sens opposés, vitesse et inclinaison liées au scroll
     ====================================================================== */
  const tracks = $$(".v2-marquee__track");
  if (tracks.length) {
    const loops = tracks.map((tr) =>
      tr.classList.contains("v2-marquee__track--rev")
        ? gsap.fromTo(tr, { xPercent: -50 }, { xPercent: 0, duration: 46, ease: "none", repeat: -1 })
        : gsap.to(tr, { xPercent: -50, duration: 40, ease: "none", repeat: -1 })
    );
    const skews = tracks.map((tr) => gsap.quickTo(tr, "skewX", { duration: 0.5, ease: "power3.out" }));
    let boost = 1;
    ST.create({
      trigger: ".v2-marquee",
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        const v = self.getVelocity();
        boost = 1 + Math.min(Math.abs(v) / 200, 8);
        skews.forEach((s) => s(gsap.utils.clamp(-14, 14, v / -160)));
      },
      onToggle: (self) => loops.forEach((l) => (self.isActive ? l.play() : l.pause())),
    });
    gsap.ticker.add(() => {
      boost += (1 - boost) * 0.06;
      loops.forEach((l) => l.timeScale(boost));
      if (boost < 1.02) skews.forEach((s) => s(0));
    });
    gsap.from(".v2-marquee__band", { scaleX: 0.2, opacity: 0, duration: 1.4, stagger: 0.12, ease: EASE, scrollTrigger: { trigger: ".v2-marquee", start: "top 95%", once: true } });
  }

  /* ======================================================================
     RÉVÉLATIONS GÉNÉRIQUES — titres en 3D, eyebrows, paragraphes
     ====================================================================== */
  const revealWords = (h, trigger) => {
    const words = splitWords(h);
    if (!words.length) return;
    gsap.set(words, { yPercent: 120, rotateX: -60, transformOrigin: "50% 100%", transformPerspective: 900 });
    ST.create({
      trigger: trigger || h,
      start: "top 85%",
      once: true,
      onEnter: () => gsap.to(words, { yPercent: 0, rotateX: 0, duration: 1.3, stagger: 0.045, ease: EASE }),
    });
  };
  $$(".v2-section .v2-h2, .v2-bigcta__title").forEach((h) => {
    if (h.id !== "objective-title") revealWords(h);
  });
  $$(".v2-section .v2-eyebrow, .v2-bigcta .v2-eyebrow").forEach((e) => {
    gsap.set(e, { "--eb": 0, opacity: 0 });
    ST.create({ trigger: e, start: "top 90%", once: true, onEnter: () => gsap.to(e, { "--eb": 1, opacity: 1, duration: 1, ease: EASE }) });
  });
  new Set($$(".v2-section .v2-lead, .v2-section .v2-head > p, .v2-section .v2-container > p:last-child")).forEach((p) => {
    gsap.from(p, { y: 24, opacity: 0, duration: 1, ease: EASE, scrollTrigger: { trigger: p, start: "top 92%", once: true } });
  });

  /* ======================================================================
     SECTIONS EMPILÉES — la section qui part recule quand la suivante arrive
     ====================================================================== */
  $$("#sur-mesure, #realisations, #offres, .v2-objective, .v2-lilac, #contact").forEach((sec) => {
    const next = sec.nextElementSibling;
    const inner = $(".v2-container", sec);
    if (!next || !inner) return;
    gsap.to(inner, {
      scale: 0.9, yPercent: 8, opacity: 0.35, ease: "none",
      scrollTrigger: { trigger: next, start: "top bottom", end: "top 20%", scrub: true },
    });
  });

  /* ======================================================================
     LAB — lignes + curseur « Tester »
     ====================================================================== */
  const rows = $$(".v2-row");
  const wrap = $(".v2-rows");
  if (rows.length) {
    gsap.from(rows, { x: -80, opacity: 0, duration: 1.2, stagger: 0.08, ease: EASE, scrollTrigger: { trigger: wrap, start: "top 82%", once: true } });
    if (finePointer) {
      const cursor = document.createElement("div");
      cursor.className = "v2-cursor";
      cursor.setAttribute("aria-hidden", "true");
      cursor.textContent = "Tester →";
      document.body.appendChild(cursor);
      wrap.classList.add("v2-cursor-on");
      const cx = gsap.quickTo(cursor, "x", { duration: 0.5, ease: "power3.out" });
      const cy = gsap.quickTo(cursor, "y", { duration: 0.5, ease: "power3.out" });
      let shown = false;
      let last = null;
      const show = (e) => {
        if (shown) return;
        shown = true;
        document.dispatchEvent(new CustomEvent("v2:cursor", { detail: { hide: true } }));
        gsap.set(cursor, { x: e.clientX, y: e.clientY });
        gsap.to(cursor, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2)", overwrite: true });
      };
      const hide = () => {
        if (!shown) return;
        shown = false;
        document.dispatchEvent(new CustomEvent("v2:cursor", { detail: { hide: false } }));
        gsap.to(cursor, { scale: 0, opacity: 0, duration: 0.35, ease: "power3.in", overwrite: true });
      };
      wrap.addEventListener("pointerenter", show);
      wrap.addEventListener("pointermove", (e) => { show(e); cx(e.clientX); cy(e.clientY); });
      wrap.addEventListener("pointerleave", hide);
      window.addEventListener("pointermove", (e) => (last = e), { passive: true });
      window.addEventListener("scroll", () => {
        const el = last && document.elementFromPoint(last.clientX, last.clientY);
        if (!el || !wrap.contains(el)) hide();
      }, { passive: true });
    }
  }

  /* ======================================================================
     RÉALISATIONS — rideau d'entrée + la galerie se redresse en 3D au scroll
     ====================================================================== */
  const projList = $("#projects-list");
  if (projList) {
    gsap.set($$(".v2-proj__img", projList), { clipPath: "inset(100% 0% 0% 0%)" });
    gsap.set($$(".v2-proj__meta, .v2-proj__text, .v2-proj__side p", projList), { y: 24, opacity: 0 });
    ST.create({
      trigger: projList,
      start: "top 80%",
      once: true,
      onEnter: () => {
        gsap.timeline({ defaults: { ease: EASE } })
          .fromTo($$(".v2-proj__img", projList), { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, stagger: 0.12, ease: "expo.inOut" }, 0)
          .fromTo($$(".v2-proj__img img", projList), { scale: 1.35 }, { scale: 1, duration: 1.9, clearProps: "transform" }, 0)
          .to($$(".v2-proj__meta, .v2-proj__text, .v2-proj__side p", projList), { y: 0, opacity: 1, duration: 1, stagger: 0.06 }, 0.6);
      },
    });
    gsap.fromTo(".v2-proj", { rotateX: 18, scale: 0.86, transformPerspective: 1600, transformOrigin: "50% 0%" }, {
      rotateX: 0, scale: 1, ease: "none",
      scrollTrigger: { trigger: "#realisations", start: "top bottom", end: "top 15%", scrub: true },
    });
  }

  /* ======================================================================
     OFFRES
     ====================================================================== */
  const plan = $(".v2-plan");
  if (plan) {
    const planA = Array.from(plan.children[0].children);
    const planB = $$("#v2-plan-desc, #v2-plan-note", plan);
    const planLi = $$("#v2-plan-list li", plan);
    gsap.set(planA.concat(planB), { y: 30, opacity: 0 });
    gsap.set(planLi, { x: -30, opacity: 0 });
    ST.create({
      trigger: plan,
      start: "top 80%",
      once: true,
      onEnter: () => {
        gsap.timeline({ defaults: { ease: EASE } })
          .to(planA, { y: 0, opacity: 1, duration: 1.1, stagger: 0.07 }, 0)
          .to(planB, { y: 0, opacity: 1, duration: 1 }, 0.15)
          .to(planLi, { x: 0, opacity: 1, duration: 1, stagger: 0.07 }, 0.2)
          .add(() => countUp($("#v2-plan-price")), 0.1);
      },
    });
  }

  /* ======================================================================
     OBJECTIF — le texte s'illumine (et se défloute) mot à mot avec le scroll
     ====================================================================== */
  const obj = $("#objective-title");
  if (obj) {
    const words = splitWords(obj, "scrub");
    gsap.fromTo(words, { opacity: 0.1, filter: "blur(6px)" }, {
      opacity: 1, filter: "blur(0px)", ease: "none", stagger: 0.1,
      scrollTrigger: { trigger: obj, start: "top 85%", end: "bottom 45%", scrub: 0.6 },
    });
  }

  /* ======================================================================
     AVIS / FAQ / GRAND CTA
     ====================================================================== */
  const quote = $("#v2-review-text");
  if (quote) revealWords(quote);
  const faqItems = $$(".v2-faq__item");
  if (faqItems.length) gsap.from(faqItems, { y: 30, opacity: 0, duration: 1, stagger: 0.07, ease: EASE, scrollTrigger: { trigger: ".v2-faq", start: "top 85%", once: true } });
  $$("#contact .v2-hero__ctas > *").forEach((el, i) =>
    gsap.from(el, { y: 20, opacity: 0, duration: 0.9, delay: i * 0.08, ease: EASE, scrollTrigger: { trigger: el, start: "top 95%", once: true } })
  );
  const bigBtn = $(".v2-bigcta__btn");
  if (bigBtn) {
    gsap.from(bigBtn, { scale: 0, rotate: -90, duration: 1.6, ease: "elastic.out(1, 0.55)", scrollTrigger: { trigger: ".v2-bigcta", start: "top 60%", once: true } });
    gsap.fromTo(".v2-bigcta__title", { xPercent: 6 }, { xPercent: -4, ease: "none", scrollTrigger: { trigger: ".v2-bigcta", start: "top bottom", end: "bottom top", scrub: true } });
  }

  /* ======================================================================
     CURSEUR + BOUTONS MAGNÉTIQUES (souris uniquement)
     ====================================================================== */
  if (finePointer) {
    const dot = document.createElement("div");
    const ring = document.createElement("div");
    dot.className = "v2-cur";
    ring.className = "v2-cur-ring";
    [dot, ring].forEach((el) => { el.setAttribute("aria-hidden", "true"); document.body.appendChild(el); });
    const dx = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3.out" });
    const dy = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3.out" });
    const rx = gsap.quickTo(ring, "x", { duration: 0.55, ease: "power3.out" });
    const ry = gsap.quickTo(ring, "y", { duration: 0.55, ease: "power3.out" });
    let seen = false;
    window.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      if (!seen) { seen = true; gsap.set([dot, ring], { x: e.clientX, y: e.clientY, opacity: 1 }); }
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      ring.classList.toggle("is-link", !!(e.target.closest && e.target.closest("a, button, [role=tab]")));
    }, { passive: true });
    document.documentElement.addEventListener("pointerleave", () => gsap.to([dot, ring], { opacity: 0, duration: 0.3 }));
    document.documentElement.addEventListener("pointerenter", () => seen && gsap.to([dot, ring], { opacity: 1, duration: 0.3 }));
    document.addEventListener("v2:cursor", (e) => { dot.classList.toggle("is-hidden", e.detail.hide); ring.classList.toggle("is-hidden", e.detail.hide); });

    $$(".v2-btn--primary, .v2-round, .v2-bigcta__btn, .v2-badge").forEach((btn) => {
      btn.classList.add("v2-magnetic");
      const mx = gsap.quickTo(btn, "x", { duration: 0.7, ease: "elastic.out(1, 0.4)" });
      const my = gsap.quickTo(btn, "y", { duration: 0.7, ease: "elastic.out(1, 0.4)" });
      const strength = btn.matches(".v2-round, .v2-bigcta__btn, .v2-badge") ? 0.4 : 0.25;
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * strength);
        my((e.clientY - r.top - r.height / 2) * strength);
      });
      btn.addEventListener("pointerleave", () => { mx(0); my(0); });
    });
  }

  /* Le header et le footer sont injectés en asynchrone : on recalcule les positions. */
  const refresh = () => ST.refresh();
  window.addEventListener("load", refresh);
  if (document.fonts) document.fonts.ready.then(refresh);
  const mo = new MutationObserver(() => { clearTimeout(mo.t); mo.t = setTimeout(refresh, 150); });
  $$("[data-site-header], [data-site-footer]").forEach((el) => mo.observe(el, { childList: true }));
})();
