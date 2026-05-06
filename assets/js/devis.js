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
  const toPayload = () => {
    const formData = new FormData(devisForm);

    return {
      service: String(formData.get("service") || ""),
      fullname: String(formData.get("fullname") || ""),
      email: String(formData.get("email") || ""),
      company: String(formData.get("company") || ""),
      website: String(formData.get("website") || ""),
      goal: String(formData.get("goal") || ""),
      budget: String(formData.get("budget") || ""),
      project_details: String(formData.get("project_details") || ""),
      start_timing: String(formData.get("start_timing") || ""),
      contact_website: String(formData.get("contact_website") || ""),
    };
  };

  const setMessage = (message, isError = false) => {
    if (!securityMessage) {
      return;
    }

    securityMessage.textContent = message;
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

    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      const response = await fetch("/api/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload()),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const fallbackError = "Une erreur est survenue. Merci de réessayer.";
        const firstError = Array.isArray(result.errors) && result.errors.length > 0 ? result.errors[0] : fallbackError;
        setMessage(firstError, true);
        return;
      }

      devisForm.reset();
      requiredFields.forEach((field) => setFieldInvalidState(field, false));
      setOfferSelectionState();
      setMessage("Merci, votre demande de devis a bien été envoyée.");
    } catch {
      setMessage("Impossible d'envoyer le formulaire pour le moment. Merci de réessayer.", true);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });

  setOfferSelectionState();
});
