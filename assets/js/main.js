"use strict";

const getPathPrefix = () => document.body.dataset.pathPrefix || "./";

const normalizePathname = (pathname) => {
  const lowerPath = pathname.toLowerCase();
  return lowerPath.endsWith("/") ? `${lowerPath}index.html` : lowerPath;
};

const parseMarkupToNodes = (markup) => {
  const parser = new DOMParser();
  const parsedDocument = parser.parseFromString(markup, "text/html");
  return Array.from(parsedDocument.body.children);
};

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
  const currentPath = normalizePathname(window.location.pathname);
  const navLinks = document.querySelectorAll(".site-nav a");

  navLinks.forEach((link) => {
    const linkUrl = new URL(link.href, window.location.origin);

    if (normalizePathname(linkUrl.pathname) === currentPath) {
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

const initIconsAndAnimations = () => {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }

  if (window.MadapesAnimations && typeof window.MadapesAnimations.run === "function") {
    window.MadapesAnimations.run();
  }
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
  initMobileNavigation();
  initProjectsSlider();
  initIconsAndAnimations();
});
