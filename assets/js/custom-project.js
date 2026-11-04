const timeline = document.querySelector("main.custom-project .sp-timeline");

if (timeline) {
  const steps = Array.from(timeline.querySelectorAll(":scope > .sp-step"));
  const desktopMotion = window.matchMedia(
    "(min-width: 900px) and (prefers-reduced-motion: no-preference)",
  );
  const mobileMotion = window.matchMedia(
    "(max-width: 899px) and (prefers-reduced-motion: no-preference)",
  );

  const setupMobile = () => {
    timeline.classList.add("sp-timeline--motion");
    steps[0]?.classList.add("is-in");

    if (steps.length < 2) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const step = entry.target;
          const index = steps.indexOf(step);
          step.classList.add("is-in");

          if (index > 0) {
            steps[index - 1].classList.add("is-linked");
          }

          observer.unobserve(step);
        });
      },
      { threshold: 0.4, rootMargin: "0px 0px -8% 0px" },
    );

    steps.slice(1).forEach((step) => observer.observe(step));
  };

  const setupDesktop = () => {
    const scroll = document.createElement("div");
    const pin = document.createElement("div");
    const nav = document.createElement("ol");
    const markers = steps.map((_, index) => {
      const item = document.createElement("li");
      item.textContent = String(index + 1).padStart(2, "0");
      nav.append(item);
      return item;
    });

    scroll.className = "sp-method-scroll";
    pin.className = "sp-method-pin";
    nav.className = "sp-method-nav";
    nav.setAttribute("aria-hidden", "true");
    scroll.style.setProperty("--step-count", String(steps.length));
    timeline.classList.add("sp-timeline--sticky");

    timeline.before(scroll);
    pin.append(nav, timeline);
    scroll.append(pin);

    const update = () => {
      const distance = scroll.offsetHeight - pin.offsetHeight;
      const passed = Math.min(Math.max(-scroll.getBoundingClientRect().top + 96, 0), distance);
      const progress = distance > 0 ? passed / distance : 0;
      const scaled = progress * Math.max(steps.length - 1, 1);
      const index = Math.min(steps.length - 1, Math.floor(scaled + 0.001));
      const local = index >= steps.length - 1 ? 0 : scaled - index;

      pin.style.setProperty("--method-progress", progress.toFixed(4));
      timeline.style.setProperty("--local", local.toFixed(4));

      steps.forEach((step, stepIndex) => {
        step.classList.toggle("is-active", stepIndex === index);
        step.classList.toggle("is-next", stepIndex === index + 1 && local > 0.02);
      });
      markers.forEach((marker, markerIndex) => {
        marker.classList.toggle("is-active", markerIndex === index);
        marker.classList.toggle("is-done", markerIndex < index);
      });
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  };

  if (desktopMotion.matches) {
    setupDesktop();
  } else if (mobileMotion.matches) {
    setupMobile();
  }
}
