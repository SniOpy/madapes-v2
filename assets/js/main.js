"use strict";

document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }

  const slider = document.querySelector("[data-projects-slider]");
  const nextButton = document.querySelector("[data-projects-next]");

  if (slider && nextButton) {
    nextButton.addEventListener("click", () => {
      slider.scrollBy({ left: 320, behavior: "smooth" });
    });
  }

  if (window.MadapesAnimations && typeof window.MadapesAnimations.run === "function") {
    window.MadapesAnimations.run();
  }
});
