"use strict";

window.MadapesAnimations = {
  run() {
    if (!window.gsap) {
      return;
    }

    const heroTitle = document.querySelector(".hero__title");
    const heroLead = document.querySelector(".hero__lead");
    const heroButtons = document.querySelector(".hero-buttons");
    const heroCard = document.querySelector(".mockup-card");
    const ctaButtons = document.querySelectorAll(".btn");
    const approachIcons = document.querySelectorAll(".approach-step__icon svg");
    const serviceIcons = document.querySelectorAll(".service-card svg");

    const introTimeline = window.gsap.timeline({ defaults: { ease: "power2.out" } });

    introTimeline
      .from(".site-header", { y: -24, opacity: 0, duration: 0.4 })
      .from(heroTitle, { y: 24, opacity: 0, duration: 0.55 }, "-=0.12")
      .from(heroLead, { y: 16, opacity: 0, duration: 0.45 }, "-=0.25")
      .from(heroButtons, { y: 14, opacity: 0, duration: 0.4 }, "-=0.2")
      .from(heroCard, { y: 18, opacity: 0, duration: 0.5 }, "-=0.28");

    ctaButtons.forEach((button) => {
      button.addEventListener("mouseenter", () => {
        window.gsap.to(button, { scale: 1.02, duration: 0.16, overwrite: true });
      });

      button.addEventListener("mouseleave", () => {
        window.gsap.to(button, { scale: 1, duration: 0.2, overwrite: true });
      });
    });

    approachIcons.forEach((icon, index) => {
      window.gsap.fromTo(
        icon,
        { y: 0, rotate: 0 },
        {
          y: -5,
          rotate: index % 2 === 0 ? -2 : 2,
          repeat: -1,
          yoyo: true,
          duration: 1 + index * 0.06,
          ease: "sine.inOut",
        }
      );
    });

    serviceIcons.forEach((icon, index) => {
      window.gsap.to(icon, {
        y: -4,
        repeat: -1,
        yoyo: true,
        duration: 1.1 + index * 0.08,
        ease: "sine.inOut",
      });
    });
  },
};
