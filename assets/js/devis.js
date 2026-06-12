"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const devisForm = document.querySelector(".devis-form");

  if (!devisForm) {
    return;
  }

  const serviceRadios = Array.from(devisForm.querySelectorAll('input[name="service"]'));
  const requiredFields = Array.from(devisForm.querySelectorAll("[required]"));
  const emailField = devisForm.querySelector('input[name="email"]');
  const projectDetailsField = devisForm.querySelector('textarea[name="project_details"]');
  const submitButton = devisForm.querySelector('button[type="submit"]');
  const submitButtonInitialText = submitButton?.textContent?.trim() || "Envoyer";

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const REQUEST_TIMEOUT_MS = window.location.hostname === "localhost" ? 12000 : 45000;

  const setOfferSelectionState = () => {
    serviceRadios.forEach((radio) => {
      const option = radio.closest(".devis-offer-option");

      if (!option) {
        return;
      }

      option.classList.toggle("is-selected", radio.checked);
    });
  };

  const setFieldInvalidState = (field, isInvalid) => {
    field.classList.toggle("is-invalid", isInvalid);
  };

  const validateField = (field) => {
    const fieldValue = field.value.trim();

    if (field.hasAttribute("required") && fieldValue.length === 0) {
      setFieldInvalidState(field, true);
      return false;
    }

    if (field === emailField && fieldValue.length > 0 && !EMAIL_PATTERN.test(fieldValue)) {
      setFieldInvalidState(field, true);
      return false;
    }

    if (field === projectDetailsField && fieldValue.length > 0 && fieldValue.length < 20) {
      setFieldInvalidState(field, true);
      return false;
    }

    setFieldInvalidState(field, false);
    return true;
  };

  const validateForm = () => requiredFields.every((field) => validateField(field));

  const setSubmitState = (isLoading) => {
    if (!submitButton) {
      return;
    }

    submitButton.disabled = isLoading;
    submitButton.setAttribute("aria-busy", isLoading ? "true" : "false");
    submitButton.textContent = isLoading ? "Envoi en cours..." : submitButtonInitialText;
  };

  const toPayload = () => {
    const formData = new FormData(devisForm);
    const fullName = String(formData.get("fullname") || "");
    const email = String(formData.get("email") || "");
    const companyName = String(formData.get("company") || "");
    const rawWebsite = String(formData.get("website") || "")
      .trim()
      .replace(/^https?:\/\//i, "");
    const serviceType = String(formData.get("service") || "");
    const projectGoal = String(formData.get("goal") || "");
    const budget = String(formData.get("budget") || "");
    const projectDescription = String(formData.get("project_details") || "");
    const startDelay = String(formData.get("start_timing") || "");
    const honeypot = String(formData.get("contact_website") || "");
    const normalizedWebsite =
      rawWebsite && !/^https?:\/\//i.test(rawWebsite) ? `https://${rawWebsite}` : rawWebsite;

    return {
      fullName,
      fullname: fullName,
      email,
      companyName,
      company: companyName,
      website: normalizedWebsite,
      serviceType,
      service: serviceType,
      goal: projectGoal,
      projectGoal,
      budget,
      projectDescription,
      project_details: projectDescription,
      startDelay,
      start_timing: startDelay,
      formSource: "devis",
      contact_website: honeypot,
    };
  };

  const showToast = (type, title, message) => {
    if (window.MadapesFormToast && typeof window.MadapesFormToast.show === "function") {
      window.MadapesFormToast.show({ type, title, message });
    }
  };

  serviceRadios.forEach((radio) => {
    radio.addEventListener("change", setOfferSelectionState);
  });

  requiredFields.forEach((field) => {
    field.addEventListener("input", () => {
      validateField(field);
    });

    field.addEventListener("blur", () => {
      validateField(field);
    });
  });

  // On Vercel, le backend Render peut etre "cold" au premier appel.
  // Ce ping silencieux limite le risque de timeout au moment du submit.
  fetch("/api/health", { method: "GET", cache: "no-store" }).catch(() => {});

  devisForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const isFormValid = validateForm();

    if (!isFormValid) {
      const firstInvalidField = devisForm.querySelector(".is-invalid");

      if (firstInvalidField) {
        firstInvalidField.focus();
      }

      return;
    }

    setSubmitState(true);

    let requestTimeoutId = null;
    try {
      const requestController = new AbortController();
      requestTimeoutId = window.setTimeout(() => requestController.abort(), REQUEST_TIMEOUT_MS);
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload()),
        signal: requestController.signal,
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        const fallbackError = "Une erreur est survenue. Merci de reessayer.";
        const firstValidationError = Array.isArray(result.errors)
          ? result.errors
              .map((errorItem) => {
                if (typeof errorItem?.msg === "string") {
                  return errorItem.msg;
                }
                if (typeof errorItem === "string") {
                  return errorItem;
                }
                return "";
              })
              .find(Boolean)
          : "";
        const safeMessage =
          firstValidationError || (typeof result.message === "string" ? result.message : fallbackError);
        showToast("error", "Envoi impossible", safeMessage);
        return;
      }

      // dataLayer event (aucune donnee personnelle : uniquement le type de prestation).
      const selectedService = devisForm.querySelector('input[name="service"]:checked');
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "lead_form_submit",
        form_name: "devis",
        service_selected: selectedService ? selectedService.value : "",
      });

      devisForm.reset();
      requiredFields.forEach((field) => setFieldInvalidState(field, false));
      setOfferSelectionState();
      showToast(
        "success",
        "Demande envoyée",
        "Merci, votre demande de devis a bien été transmise. Nous revenons vers vous rapidement.",
      );
    } catch (error) {
      if (error?.name === "AbortError") {
        showToast(
          "error",
          "Délai dépassé",
          "Le serveur met plus de temps à répondre. Merci de réessayer dans quelques secondes.",
        );
        return;
      }
      showToast(
        "error",
        "Envoi impossible",
        "Impossible d'envoyer le formulaire pour le moment. Merci de réessayer.",
      );
    } finally {
      if (requestTimeoutId) {
        window.clearTimeout(requestTimeoutId);
      }
      setSubmitState(false);
    }
  });

  setOfferSelectionState();
});
