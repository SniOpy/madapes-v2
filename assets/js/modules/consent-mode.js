/* ==========================================================================
   Google Consent Mode v2 - Madapes Agency
   --------------------------------------------------------------------------
   Ce script DOIT etre charge dans le <head>, AVANT Google Tag Manager.
   Il :
     1. initialise dataLayer + gtag()
     2. pose le consentement par defaut a "denied" (RGPD : refus avant choix)
     3. applique le consentement deja stocke (si l'utilisateur a deja choisi)
     4. charge Google Tag Manager (le gating des tags est gere par Consent Mode)
     5. charge Microsoft Clarity UNIQUEMENT si la mesure d'audience est acceptee

   A terme : privilegier une CSP geree cote serveur (Helmet) avec nonces par
   requete plutot que 'unsafe-inline'. Ici le script est externe, donc aucun
   script inline n'est necessaire.
   ========================================================================== */
(function () {
  "use strict";

  /* ====================== CONFIG (a modifier ici) ======================= */
  var CONFIG = {
    GTM_ID: "GTM-NBMVWX4M", // <-- ID Google Tag Manager
    CLARITY_ID: "x07ay37v41", // <-- ID Microsoft Clarity (charge si analytics accepte)
    STORAGE_KEY: "madapes_cookie_consent",
  };
  /* ====================================================================== */

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  // 1. Consentement par defaut : tout refuse (avant tout choix utilisateur).
  gtag("consent", "default", {
    ad_storage: "denied",
    analytics_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500,
  });

  // Bonnes pratiques Consent Mode v2 / Google Ads.
  gtag("set", "ads_data_redaction", true);
  gtag("set", "url_passthrough", true);

  /* ----------------------------- Stockage ------------------------------ */
  function getConsent() {
    try {
      var raw = window.localStorage.getItem(CONFIG.STORAGE_KEY);
      if (!raw) {
        return null;
      }
      var parsed = JSON.parse(raw);
      if (typeof parsed !== "object" || parsed === null) {
        return null;
      }
      return {
        analytics: parsed.analytics === true,
        ads: parsed.ads === true,
        date: typeof parsed.date === "string" ? parsed.date : null,
      };
    } catch (error) {
      return null;
    }
  }

  function saveConsent(choice) {
    var payload = {
      analytics: choice.analytics === true,
      ads: choice.ads === true,
      date: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      /* localStorage indisponible : on continue sans persistance. */
    }
    return payload;
  }

  /* --------------------- Mapping consentement -> gtag ------------------- */
  function toConsentSignals(choice) {
    var analyticsGranted = choice.analytics === true ? "granted" : "denied";
    var adsGranted = choice.ads === true ? "granted" : "denied";
    return {
      analytics_storage: analyticsGranted,
      ad_storage: adsGranted,
      ad_user_data: adsGranted,
      ad_personalization: adsGranted,
    };
  }

  function updateConsent(choice) {
    gtag("consent", "update", toConsentSignals(choice));
  }

  /* ----------------------- Chargement des tags ------------------------- */
  var gtmLoaded = false;
  function loadGtm() {
    if (gtmLoaded || !CONFIG.GTM_ID || CONFIG.GTM_ID.indexOf("GTM-") !== 0) {
      return;
    }
    gtmLoaded = true;
    window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    var firstScript = document.getElementsByTagName("script")[0];
    var gtmScript = document.createElement("script");
    gtmScript.async = true;
    gtmScript.src = "https://www.googletagmanager.com/gtm.js?id=" + CONFIG.GTM_ID;
    firstScript.parentNode.insertBefore(gtmScript, firstScript);
  }

  var clarityLoaded = false;
  function loadClarity() {
    if (clarityLoaded || !CONFIG.CLARITY_ID) {
      return;
    }
    clarityLoaded = true;
    (function (c, l, a, r, i, t, y) {
      c[a] =
        c[a] ||
        function () {
          (c[a].q = c[a].q || []).push(arguments);
        };
      t = l.createElement(r);
      t.async = 1;
      t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", CONFIG.CLARITY_ID);
  }

  /* -------------------------- API publique ----------------------------- */
  function applyConsent(choice) {
    var normalized = {
      analytics: choice && choice.analytics === true,
      ads: choice && choice.ads === true,
    };
    updateConsent(normalized);
    var saved = saveConsent(normalized);
    if (normalized.analytics) {
      loadClarity();
    }
    window.dataLayer.push({ event: "consent_update", consent: normalized });
    return saved;
  }

  // 2. Applique le consentement deja stocke (mise a jour avant le chargement des tags).
  var stored = getConsent();
  if (stored) {
    updateConsent(stored);
  }

  // 3. GTM se charge toujours : c'est Consent Mode qui regule le declenchement des tags.
  loadGtm();

  // 4. Clarity uniquement si la mesure d'audience est deja acceptee.
  if (stored && stored.analytics) {
    loadClarity();
  }

  window.MadapesConsent = {
    config: CONFIG,
    getConsent: getConsent,
    applyConsent: applyConsent,
    loadClarity: loadClarity,
    hasStoredConsent: function () {
      return getConsent() !== null;
    },
    // Rempli par cookie-banner.js pour rouvrir le panneau de preferences.
    openSettings: function () {},
  };
})();
