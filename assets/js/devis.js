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
  const securityMessage = devisForm.querySelector(".devis-form-security");
  const submitButton = devisForm.querySelector('button[type="submit"]');
  const submitButtonInitialText = submitButton?.textContent?.trim() || "Envoyer";
  const securityMessageTextElement = securityMessage
    ? securityMessage.querySelector("[data-form-message-text]") || (() => {
        const textSpan = document.createElement("span");
        textSpan.setAttribute("data-form-message-text", "");
        textSpan.textContent = securityMessage.textContent.trim();
        securityMessage.textContent = "";
        securityMessage.appendChild(textSpan);
        return textSpan;
      })()
    : null;

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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
    const rawWebsite = String(formData.get("website") || "").trim();
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
      contact_website: honeypot,
    };
  };

  const setMessage = (message, isError = false) => {
    if (!securityMessage || !securityMessageTextElement) {
      return;
    }

    securityMessageTextElement.textContent = message;
    securityMessage.classList.toggle("devis-form-security--error", isError);
    securityMessage.classList.toggle("devis-form-security--success", !isError);
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
      requestTimeoutId = window.setTimeout(() => requestController.abort(), 12000);

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
        setMessage(safeMessage, true);
        return;
      }

      devisForm.reset();
      requiredFields.forEach((field) => setFieldInvalidState(field, false));
      setOfferSelectionState();
      setMessage("Merci, votre demande a bien ete envoyee.");
    } catch (error) {
      if (error?.name === "AbortError") {
        setMessage("Le delai d'envoi est depasse. Merci de reessayer dans quelques secondes.", true);
        return;
      }
      setMessage("Impossible d'envoyer le formulaire pour le moment. Merci de reessayer.", true);
    } finally {
      if (requestTimeoutId) {
        window.clearTimeout(requestTimeoutId);
      }
      setSubmitState(false);
    }
  });

  setOfferSelectionState();
});
