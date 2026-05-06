"use strict";

(() => {
  const PUBLIC_CONFIG_ENDPOINT = "/api/public-config";
  const SITE_KEY_META_SELECTOR = 'meta[name="recaptcha-site-key"]';
  const DEV_BYPASS_TOKEN = "local-dev-bypass";
  const PUBLIC_CONFIG_TIMEOUT_MS = 10000;
  let cachedSiteKeyPromise = null;
  let cachedScriptPromise = null;
  const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);

  const readSiteKeyFromDom = () => {
    const metaTag = document.querySelector(SITE_KEY_META_SELECTOR);
    const fromMeta = metaTag?.getAttribute("content") || "";
    const fromWindow = window.MADAPES_RECAPTCHA_SITE_KEY || "";
    return String(fromWindow || fromMeta).trim();
  };

  const fetchSiteKeyFromApi = async () => {
    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => abortController.abort(), PUBLIC_CONFIG_TIMEOUT_MS);
    let response;

    try {
      response = await fetch(PUBLIC_CONFIG_ENDPOINT, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: abortController.signal,
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new Error("Timed out while loading public reCAPTCHA configuration.");
      }
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error("Unable to load public reCAPTCHA configuration.");
    }

    const data = await response.json();
    return String(data?.recaptchaSiteKey || "").trim();
  };

  const getSiteKey = async () => {
    if (!cachedSiteKeyPromise) {
      cachedSiteKeyPromise = (async () => {
        const domSiteKey = readSiteKeyFromDom();
        if (domSiteKey) {
          return domSiteKey;
        }
        return fetchSiteKeyFromApi();
      })();
    }

    return cachedSiteKeyPromise;
  };

  const loadRecaptchaScript = (siteKey) => {
    if (window.grecaptcha && typeof window.grecaptcha.ready === "function") {
      return Promise.resolve();
    }

    if (!cachedScriptPromise) {
      cachedScriptPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Unable to load reCAPTCHA script."));
        document.head.appendChild(script);
      });
    }

    return cachedScriptPromise;
  };

  const execute = async (action) => {
    try {
      const siteKey = await getSiteKey();

      if (!siteKey) {
        throw new Error("Missing reCAPTCHA site key.");
      }

      await loadRecaptchaScript(siteKey);

      if (!window.grecaptcha || typeof window.grecaptcha.execute !== "function") {
        throw new Error("reCAPTCHA is not available.");
      }

      return new Promise((resolve, reject) => {
        window.grecaptcha.ready(async () => {
          try {
            const token = await window.grecaptcha.execute(siteKey, { action });
            resolve(token);
          } catch (error) {
            reject(error);
          }
        });
      });
    } catch (error) {
      if (isLocalHost) {
        console.warn("reCAPTCHA unavailable in local mode, using dev bypass token.", error);
        return DEV_BYPASS_TOKEN;
      }

      throw error;
    }
  };

  window.MadapesRecaptcha = {
    getSiteKey,
    execute,
  };
})();
