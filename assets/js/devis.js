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

  devisForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const isFormValid = validateForm();

    if (!isFormValid) {
      const firstInvalidField = devisForm.querySelector(".is-invalid");

      if (firstInvalidField) {
        firstInvalidField.focus();
      }

      return;
    }

    if (securityMessage) {
      securityMessage.textContent = "Formulaire valide. Prochaine étape disponible côté backend.";
    }
  });

  setOfferSelectionState();
});
