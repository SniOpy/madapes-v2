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
    const rawWebsite = String(formData.get("website") || "").trim();
    const normalizedWebsite =
      rawWebsite && !/^https?:\/\//i.test(rawWebsite) ? `https://${rawWebsite}` : rawWebsite;

    return {
      fullName: String(formData.get("fullname") || ""),
      email: String(formData.get("email") || ""),
      companyName: String(formData.get("company") || ""),
      website: normalizedWebsite,
      serviceType: String(formData.get("service") || ""),
      projectGoal: String(formData.get("goal") || ""),
      budget: String(formData.get("budget") || ""),
      projectDescription: String(formData.get("project_details") || ""),
      startDelay: String(formData.get("start_timing") || ""),
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
    let shouldUnlockSubmit = true;

    try {
      const recaptcha = window.MadapesRecaptcha;
      const recaptchaToken = await recaptcha.execute("contact_form");

      if (!recaptchaToken) {
        setMessage("La verification anti-spam a echoue. Merci de reessayer.", true);
        return;
      }

      const payload = {
        ...toPayload(),
        recaptchaToken,
      };

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        const fallbackError = "Une erreur est survenue. Merci de reessayer.";
        const firstValidationError = Array.isArray(result.errors)
          ? result.errors.find((errorItem) => typeof errorItem?.msg === "string")?.msg
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
      shouldUnlockSubmit = false;
    } catch {
      setMessage("Impossible d'envoyer le formulaire pour le moment. Merci de reessayer.", true);
    } finally {
      if (shouldUnlockSubmit) {
        setSubmitState(false);
      }
    }
  });

  setOfferSelectionState();
});
