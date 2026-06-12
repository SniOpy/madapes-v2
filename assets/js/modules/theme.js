(function () {
  "use strict";

  var THEME_STORAGE_KEY = "madapes-theme";

  function getStoredTheme() {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
    } catch (_error) {
      return "dark";
    }
  }

  function applyTheme(theme) {
    var isLight = theme === "light";

    if (isLight) {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, isLight ? "light" : "dark");
    } catch (_error) {
      /* localStorage unavailable */
    }

    document.querySelectorAll("[data-theme-toggle]").forEach(function (toggle) {
      toggle.classList.toggle("is-light", isLight);
      toggle.setAttribute("aria-pressed", isLight ? "true" : "false");
      toggle.setAttribute(
        "aria-label",
        isLight ? "Activer le mode sombre" : "Activer le mode clair",
      );
    });

    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }

  function initThemeToggle() {
    var toggles = document.querySelectorAll("[data-theme-toggle]");

    if (toggles.length === 0) {
      return;
    }

    applyTheme(getStoredTheme());

    toggles.forEach(function (toggle) {
      toggle.addEventListener("click", function () {
        var nextTheme = getStoredTheme() === "light" ? "dark" : "light";
        applyTheme(nextTheme);
      });
    });
  }

  window.MadapesTheme = {
    applyTheme: applyTheme,
    getStoredTheme: getStoredTheme,
    initThemeToggle: initThemeToggle,
  };
})();
