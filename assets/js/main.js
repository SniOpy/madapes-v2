"use strict";

document.addEventListener("DOMContentLoaded", () => {
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

  if (mobileNav && menuToggle) {
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
  }

  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }

  const slider = document.querySelector("[data-projects-slider]");
  const prevButton = document.querySelector("[data-projects-prev]");
  const nextButton = document.querySelector("[data-projects-next]");

  if (slider && prevButton && nextButton) {
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
  }

  if (window.MadapesAnimations && typeof window.MadapesAnimations.run === "function") {
    window.MadapesAnimations.run();
  }
});
