"use strict";

const getPathPrefix = () => document.body.dataset.pathPrefix || "./";
const ROUTE_ALIASES = new Map([
  ["/services", "/pages/services.html"],
  ["/tracking", "/pages/tracking.html"],
  ["/offres", "/pages/offres.html"],
  ["/starter", "/pages/starter.html"],
  ["/growth", "/pages/growth.html"],
  ["/blog", "/pages/blog.html"],
  ["/realisations", "/pages/realisations.html"],
  ["/google-ads", "/pages/google-ads.html"],
  ["/landing-pages", "/pages/landing-pages.html"],
  ["/seo", "/pages/seo.html"],
  ["/contact", "/pages/contact.html"],
  ["/devis", "/pages/devis.html"],
  ["/plan-du-site", "/pages/plan-du-site.html"],
  ["/cgs", "/pages/cgs.html"],
  ["/mentions-legales", "/pages/mentions-legales.html"],
  ["/politique-confidentialite", "/pages/politique-confidentialite.html"],
  ["/gestion-cookies", "/pages/gestion-cookies.html"],
]);

const normalizePathname = (pathname) => {
  const lowerPath = pathname.toLowerCase();
  return lowerPath.endsWith("/") ? `${lowerPath}index.html` : lowerPath;
};

const toCanonicalPath = (pathname) => {
  const normalizedPath = normalizePathname(pathname);

  if (ROUTE_ALIASES.has(normalizedPath)) {
    return ROUTE_ALIASES.get(normalizedPath);
  }

  for (const [slugPath, htmlPath] of ROUTE_ALIASES.entries()) {
    if (htmlPath === normalizedPath) {
      return htmlPath;
    }
    if (slugPath === normalizedPath) {
      return htmlPath;
    }
  }

  return normalizedPath;
};

const parseMarkupToNodes = (markup) => {
  const parser = new DOMParser();
  const parsedDocument = parser.parseFromString(markup, "text/html");
  return Array.from(parsedDocument.body.children);
};

const CALENDLY_WIDGET_SRC = "https://assets.calendly.com/assets/external/widget.js";
let calendlyWidgetPromise = null;

const loadComponent = async (slotSelector, fileName) => {
  const slot = document.querySelector(slotSelector);

  if (!slot) {
    return;
  }

  const basePath = getPathPrefix();
  const response = await fetch(`${basePath}components/${fileName}`, { credentials: "same-origin" });

  if (!response.ok) {
    throw new Error(`Unable to load component: ${fileName}`);
  }

  const rawMarkup = await response.text();
  const resolvedMarkup = rawMarkup.replaceAll("{{BASE}}", basePath);
  const nodes = parseMarkupToNodes(resolvedMarkup);
  const fragment = document.createDocumentFragment();

  nodes.forEach((node) => {
    fragment.appendChild(node);
  });

  slot.replaceChildren(fragment);
};

const setActivePageLink = () => {
  const currentPath = toCanonicalPath(window.location.pathname);
  const navLinks = document.querySelectorAll(".site-nav a");

  navLinks.forEach((link) => {
    const linkUrl = new URL(link.href, window.location.origin);

    if (toCanonicalPath(linkUrl.pathname) === currentPath) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

const initMobileNavigation = () => {
  const mobileNav = document.querySelector("#mobile-nav");
  const menuToggle = document.querySelector(".menu-toggle");

  const closeMobileMenu = () => {
    if (!mobileNav || !menuToggle) {
      return;
    }

    mobileNav.classList.remove("is-open");
    menuToggle.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  };

  if (!mobileNav || !menuToggle) {
    return;
  }

  menuToggle.addEventListener("click", () => {
    const isOpen = mobileNav.classList.toggle("is-open");
    menuToggle.classList.toggle("is-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 960) {
      closeMobileMenu();
    }
  });
};

const initServicesDropdown = () => {
  const dropdownItem = document.querySelector(".site-nav__dropdown-item");
  const toggleButton = document.querySelector("[data-services-toggle]");
  const dropdownMenu = document.querySelector("[data-services-dropdown]");

  if (!dropdownItem || !toggleButton || !dropdownMenu) {
    return;
  }

  const closeDropdown = () => {
    dropdownItem.classList.remove("is-open");
    toggleButton.setAttribute("aria-expanded", "false");
  };

  const openDropdown = () => {
    dropdownItem.classList.add("is-open");
    toggleButton.setAttribute("aria-expanded", "true");
  };

  const toggleDropdown = () => {
    if (dropdownItem.classList.contains("is-open")) {
      closeDropdown();
    } else {
      openDropdown();
    }
  };

  toggleButton.addEventListener("click", (event) => {
    event.preventDefault();
    toggleDropdown();
  });

  toggleButton.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openDropdown();
      const firstLink = dropdownMenu.querySelector("a");
      if (firstLink) {
        firstLink.focus();
      }
    }
  });

  document.addEventListener("click", (event) => {
    if (!dropdownItem.contains(event.target)) {
      closeDropdown();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeDropdown();
      toggleButton.focus();
    }
  });

  const currentPath = toCanonicalPath(window.location.pathname);
  const dropdownLinks = Array.from(dropdownMenu.querySelectorAll("a"));
  const hasCurrentChild = dropdownLinks.some((link) => {
    const linkUrl = new URL(link.href, window.location.origin);
    return toCanonicalPath(linkUrl.pathname) === currentPath;
  });

  if (hasCurrentChild) {
    toggleButton.setAttribute("aria-current", "page");
  } else {
    toggleButton.removeAttribute("aria-current");
  }
};

const initProjectsSlider = () => {
  const slider = document.querySelector("[data-projects-slider]");
  const prevButton = document.querySelector("[data-projects-prev]");
  const nextButton = document.querySelector("[data-projects-next]");

  if (!slider || !prevButton || !nextButton) {
    return;
  }

  const getScrollAmount = () => {
    const firstCard = slider.querySelector(".project-card");

    if (!firstCard) {
      return 320;
    }

    const sliderStyles = window.getComputedStyle(slider);
    const gap = Number.parseFloat(sliderStyles.columnGap || sliderStyles.gap || "0");

    return firstCard.getBoundingClientRect().width + gap;
  };

  prevButton.addEventListener("click", () => {
    slider.scrollBy({ left: -getScrollAmount(), behavior: "smooth" });
  });

  nextButton.addEventListener("click", () => {
    slider.scrollBy({ left: getScrollAmount(), behavior: "smooth" });
  });
};

const initScrollTopButton = () => {
  const scrollTopButton = document.querySelector("[data-scroll-top]");

  if (!scrollTopButton) {
    return;
  }

  const toggleVisibility = () => {
    const shouldShow = window.scrollY > 280;
    scrollTopButton.classList.toggle("is-visible", shouldShow);
    scrollTopButton.setAttribute("aria-hidden", shouldShow ? "false" : "true");
  };

  scrollTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("scroll", toggleVisibility, { passive: true });
  toggleVisibility();
};

const loadCalendlyWidget = () => {
  if (window.Calendly) {
    return Promise.resolve(window.Calendly);
  }

  if (calendlyWidgetPromise) {
    return calendlyWidgetPromise;
  }

  calendlyWidgetPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CALENDLY_WIDGET_SRC;
    script.async = true;
    script.onload = () => resolve(window.Calendly);
    script.onerror = () => reject(new Error("Calendly widget failed to load"));
    document.head.appendChild(script);
  });

  return calendlyWidgetPromise;
};

const openCalendlyPopup = async (url) => {
  if (!url) {
    return false;
  }

  try {
    const calendly = await loadCalendlyWidget();

    if (!calendly || typeof calendly.initPopupWidget !== "function") {
      return false;
    }

    calendly.initPopupWidget({ url });
    return true;
  } catch (error) {
    console.warn(error);
    return false;
  }
};

const initCalendlyLinks = () => {
  const calendlyLinks = document.querySelectorAll("[data-calendly-link]");

  if (!calendlyLinks.length) {
    return;
  }

  calendlyLinks.forEach((link) => {
    link.addEventListener("click", async (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const calendlyUrl = link.dataset.calendlyUrl || link.href;

      event.preventDefault();
      const hasOpenedPopup = await openCalendlyPopup(calendlyUrl);

      if (!hasOpenedPopup) {
        window.open(calendlyUrl, "_blank", "noopener,noreferrer");
      }
    });
  });
};

const initIconsAndAnimations = () => {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }

  if (window.MadapesAnimations && typeof window.MadapesAnimations.run === "function") {
    window.MadapesAnimations.run();
  }
};

const ensureIconsAfterLoad = () => {
  const runIcons = () => {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  };

  window.addEventListener("load", runIcons, { once: true });
  setTimeout(runIcons, 800);
};

const initCursorGlow = () => {
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!finePointer || reducedMotion) {
    return;
  }

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;
  let isRunning = false;

  const setGlowPosition = () => {
    document.body.style.setProperty("--cursor-x", `${currentX}px`);
    document.body.style.setProperty("--cursor-y", `${currentY}px`);
  };

  const render = () => {
    currentX += (targetX - currentX) * 0.1;
    currentY += (targetY - currentY) * 0.1;
    setGlowPosition();
    requestAnimationFrame(render);
  };

  const startRenderLoop = () => {
    if (isRunning) {
      return;
    }

    isRunning = true;
    requestAnimationFrame(render);
  };

  document.addEventListener(
    "mousemove",
    (event) => {
      targetX = event.clientX;
      targetY = event.clientY;

      if (!document.body.classList.contains("is-cursor-glow-active")) {
        currentX = targetX;
        currentY = targetY;
        setGlowPosition();
        document.body.classList.add("is-cursor-glow-active");
        startRenderLoop();
      }
    },
    { passive: true },
  );

  document.addEventListener("mouseleave", () => {
    document.body.classList.remove("is-cursor-glow-active");
  });

  document.addEventListener("mouseenter", () => {
    if (isRunning) {
      document.body.classList.add("is-cursor-glow-active");
    }
  });
};

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await Promise.all([
      loadComponent("[data-site-header]", "header.html"),
      loadComponent("[data-site-footer]", "footer.html"),
    ]);
  } catch (error) {
    console.warn(error);
  }

  setActivePageLink();
  initServicesDropdown();
  initMobileNavigation();
  initProjectsSlider();
  initScrollTopButton();
  initCalendlyLinks();
  initCursorGlow();
  initIconsAndAnimations();
  ensureIconsAfterLoad();
});
