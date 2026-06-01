/* ==========================================================================
   Banniere de consentement cookies - Madapes Agency
   --------------------------------------------------------------------------
   Depend de consent-mode.js (window.MadapesConsent).
   - Affiche la banniere uniquement si aucun choix n'a encore ete enregistre.
   - Boutons : Accepter / Refuser / Personnaliser.
   - Panneau "Personnaliser" : Mesure d'audience (analytics) + Publicite (ads).
   - Aucune dependance externe, DOM construit en JS, banniere fixed (pas de CLS).
   ========================================================================== */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var consent = window.MadapesConsent;
    if (!consent) {
      // consent-mode.js doit etre charge avant ce module.
      return;
    }

    var root = document.createElement("div");
    root.className = "cookie-consent";
    root.setAttribute("hidden", "");
    root.innerHTML = [
      '<div class="cookie-consent__banner" role="dialog" aria-modal="false"',
      '     aria-labelledby="cookie-consent-title" aria-describedby="cookie-consent-desc">',
      '  <div class="cookie-consent__body">',
      '    <h2 id="cookie-consent-title" class="cookie-consent__title">Votre confidentialite</h2>',
      '    <p id="cookie-consent-desc" class="cookie-consent__text">',
      "      Nous utilisons des cookies pour mesurer l'audience, suivre les performances de nos",
      "      campagnes et ameliorer votre experience.",
      "    </p>",
      '  </div>',
      '  <div class="cookie-consent__actions">',
      '    <button type="button" class="btn btn-secondary" data-cc="customize">Personnaliser</button>',
      '    <button type="button" class="btn btn-ghost" data-cc="refuse">Refuser</button>',
      '    <button type="button" class="btn btn-primary" data-cc="accept">Accepter</button>',
      '  </div>',
      "</div>",
      '<div class="cookie-consent__panel" role="dialog" aria-modal="true" hidden',
      '     aria-labelledby="cookie-panel-title">',
      '  <div class="cookie-consent__panel-head">',
      '    <h2 id="cookie-panel-title" class="cookie-consent__title">Parametres des cookies</h2>',
      '    <p class="cookie-consent__text">Choisissez les categories que vous souhaitez activer.</p>',
      "  </div>",
      '  <ul class="cookie-consent__list">',
      '    <li class="cookie-option">',
      '      <div class="cookie-option__info">',
      '        <span class="cookie-option__name">Cookies necessaires</span>',
      '        <span class="cookie-option__desc">Indispensables au fonctionnement du site.</span>',
      "      </div>",
      '      <span class="cookie-option__state">Toujours actifs</span>',
      "    </li>",
      '    <li class="cookie-option">',
      '      <div class="cookie-option__info">',
      '        <span class="cookie-option__name">Mesure d\'audience</span>',
      '        <span class="cookie-option__desc">Statistiques de visite (analytics_storage).</span>',
      "      </div>",
      '      <label class="cookie-switch">',
      '        <input type="checkbox" data-cc-toggle="analytics" />',
      '        <span class="cookie-switch__track" aria-hidden="true"></span>',
      '        <span class="cookie-switch__label">Mesure d\'audience</span>',
      "      </label>",
      "    </li>",
      '    <li class="cookie-option">',
      '      <div class="cookie-option__info">',
      '        <span class="cookie-option__name">Publicite &amp; conversions</span>',
      '        <span class="cookie-option__desc">Suivi des campagnes Google Ads (ad_storage, ad_user_data, ad_personalization).</span>',
      "      </div>",
      '      <label class="cookie-switch">',
      '        <input type="checkbox" data-cc-toggle="ads" />',
      '        <span class="cookie-switch__track" aria-hidden="true"></span>',
      '        <span class="cookie-switch__label">Publicite et conversions</span>',
      "      </label>",
      "    </li>",
      "  </ul>",
      '  <div class="cookie-consent__actions">',
      '    <button type="button" class="btn btn-ghost" data-cc="refuse-all">Tout refuser</button>',
      '    <button type="button" class="btn btn-secondary" data-cc="accept-all">Tout accepter</button>',
      '    <button type="button" class="btn btn-primary" data-cc="save">Enregistrer mes choix</button>',
      "  </div>",
      "</div>",
    ].join("");

    document.body.appendChild(root);

    var banner = root.querySelector(".cookie-consent__banner");
    var panel = root.querySelector(".cookie-consent__panel");
    var analyticsToggle = root.querySelector('[data-cc-toggle="analytics"]');
    var adsToggle = root.querySelector('[data-cc-toggle="ads"]');

    var lastFocusedElement = null;

    function show() {
      lastFocusedElement = document.activeElement;
      root.removeAttribute("hidden");
    }

    function hide() {
      root.setAttribute("hidden", "");
      panel.setAttribute("hidden", "");
      banner.removeAttribute("hidden");
      if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
        lastFocusedElement.focus();
      }
    }

    function openPanel() {
      var stored = consent.getConsent();
      analyticsToggle.checked = stored ? stored.analytics === true : false;
      adsToggle.checked = stored ? stored.ads === true : false;
      banner.setAttribute("hidden", "");
      panel.removeAttribute("hidden");
      root.removeAttribute("hidden");
      analyticsToggle.focus();
    }

    function commit(choice) {
      consent.applyConsent(choice);
      hide();
    }

    root.addEventListener("click", function (event) {
      var trigger = event.target.closest("[data-cc]");
      if (!trigger) {
        return;
      }
      var action = trigger.getAttribute("data-cc");

      if (action === "accept") {
        commit({ analytics: true, ads: true });
      } else if (action === "refuse") {
        commit({ analytics: false, ads: false });
      } else if (action === "customize") {
        openPanel();
      } else if (action === "accept-all") {
        commit({ analytics: true, ads: true });
      } else if (action === "refuse-all") {
        commit({ analytics: false, ads: false });
      } else if (action === "save") {
        commit({ analytics: analyticsToggle.checked, ads: adsToggle.checked });
      }
    });

    root.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !panel.hasAttribute("hidden")) {
        panel.setAttribute("hidden", "");
        banner.removeAttribute("hidden");
        var customizeBtn = banner.querySelector('[data-cc="customize"]');
        if (customizeBtn) {
          customizeBtn.focus();
        }
      }
    });

    // Permet de rouvrir les preferences (ex: lien "Gerer les cookies" du footer).
    consent.openSettings = function () {
      openPanel();
    };

    // Delegation : fonctionne aussi pour le footer injecte dynamiquement.
    document.addEventListener("click", function (event) {
      var trigger = event.target.closest && event.target.closest("[data-cookie-settings]");
      if (trigger) {
        event.preventDefault();
        openPanel();
      }
    });

    // Affiche la banniere uniquement si aucun choix n'a encore ete fait.
    if (!consent.hasStoredConsent()) {
      show();
    }
  });
})();
