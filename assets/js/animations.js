"use strict";

window.MadapesAnimations = {
  run() {
    if (!window.gsap) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const heroTitles = document.querySelectorAll(
      ".hero h1, .ga-hero h1, .lp-hero h1, .devis-hero h1, .contact-hero h1, .seo-hero h1, .error-hero h1, .tracking-hero h1, .offres-hero h1, .starter-hero h1"
    );
    const heroButtons = document.querySelector(".hero-buttons");
    const ctaButtons = document.querySelectorAll(".btn");
    const approachIcons = document.querySelectorAll(".approach-step__icon svg");
    const serviceIcons = document.querySelectorAll(".service-card svg");
    const landingInlineIcons = document.querySelectorAll(".landing-page .lp-inline-icon svg");
    const landingProcessIcons = document.querySelectorAll(".landing-page .lp-process-step__icon svg");
    const devisCard = document.querySelector(".devis-card");
    const devisTrustItems = document.querySelectorAll(".devis-trust li");
    const landingCards = document.querySelectorAll(
      ".landing-page .lp-focus-card, .landing-page .lp-feature-card, .landing-page .lp-mockup-card"
    );

    if (!prefersReducedMotion) {
      const introTimeline = window.gsap.timeline({ defaults: { ease: "power2.out" } });

      introTimeline
        .from(".site-header", { y: -24, opacity: 0, duration: 0.32 })
        .from(heroTitles, { y: 12, opacity: 0, duration: 0.44, stagger: 0.06 }, "-=0.08")
        .from(
          ".hero__lead, .seo-hero__lead, .tracking-hero__lead, .offres-hero__lead, .starter-hero__lead, .ga-hero__lead, .contact-hero__lead, .devis-hero__lead, .landing-page .lp-hero__lead",
          { y: 12, opacity: 0, duration: 0.38 },
          "-=0.2"
        )
        .from(heroButtons, { y: 10, opacity: 0, duration: 0.34 }, "-=0.18")
        .from(
          ".hero-laptop, .tracking-hero-card, .offres-hero-card",
          { y: 14, opacity: 0, duration: 0.4 },
          "-=0.2"
        );

      if (document.querySelector(".landing-page")) {
        introTimeline
          .from(".lp-hero__points li", { y: 8, opacity: 0, stagger: 0.06, duration: 0.28 }, "-=0.14");
      }

      if (document.querySelector(".starter-page")) {
        introTimeline
          .from(
            ".starter-compare__panel",
            { y: 22, opacity: 0, stagger: 0.14, duration: 0.48, ease: "power2.out" },
            "-=0.12"
          )
          .from(
            ".starter-compare__connector",
            { scale: 0.6, opacity: 0, duration: 0.36, ease: "back.out(1.6)" },
            "-=0.35"
          );
      }
    }

    ctaButtons.forEach((button) => {
      button.addEventListener("mouseenter", () => {
        window.gsap.to(button, { scale: 1.02, duration: 0.16, overwrite: true });
      });

      button.addEventListener("mouseleave", () => {
        window.gsap.to(button, { scale: 1, duration: 0.2, overwrite: true });
      });
    });

    if (!prefersReducedMotion) {
      approachIcons.forEach((icon, index) => {
        window.gsap.fromTo(
          icon,
          { y: 0, rotate: 0 },
          {
            y: -5,
            rotate: index % 2 === 0 ? -2 : 2,
            repeat: -1,
            yoyo: true,
            duration: 1.2 + index * 0.06,
            ease: "sine.inOut",
          }
        );
      });

      serviceIcons.forEach((icon, index) => {
        window.gsap.to(icon, {
          y: -3,
          repeat: -1,
          yoyo: true,
          duration: 1.25 + index * 0.08,
          ease: "sine.inOut",
        });
      });

      landingInlineIcons.forEach((icon, index) => {
        window.gsap.to(icon, {
          y: -2,
          repeat: -1,
          yoyo: true,
          duration: 1.2 + index * 0.05,
          ease: "sine.inOut",
        });
      });

      landingProcessIcons.forEach((icon, index) => {
        window.gsap.to(icon, {
          rotate: index % 2 === 0 ? -4 : 4,
          transformOrigin: "center",
          repeat: -1,
          yoyo: true,
          duration: 1.5 + index * 0.08,
          ease: "sine.inOut",
        });
      });

      window.gsap.from(landingCards, {
        y: 14,
        opacity: 0,
        duration: 0.42,
        stagger: 0.05,
        ease: "power2.out",
      });

      if (devisCard) {
        window.gsap.to(devisCard, {
          y: -6,
          repeat: -1,
          yoyo: true,
          duration: 1.6,
          ease: "sine.inOut",
        });
      }

      if (devisTrustItems.length > 0) {
        window.gsap.from(devisTrustItems, {
          y: 8,
          opacity: 0,
          duration: 0.35,
          stagger: 0.06,
          ease: "power2.out",
        });
      }
    }
  },
};
