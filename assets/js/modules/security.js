"use strict";

window.MadapesSecurity = {
  sanitizeText(value) {
    if (typeof value !== "string") {
      return "";
    }

    return value.replace(/[<>`"'\\]/g, "").trim();
  },

  isValidEmail(value) {
    if (typeof value !== "string") {
      return false;
    }

    const safeValue = value.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailPattern.test(safeValue);
  },
};
