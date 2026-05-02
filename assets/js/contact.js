"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const contactForm = document.querySelector(".contact-form");

  if (!contactForm) {
    return;
  }

  const requiredFields = Array.from(contactForm.querySelectorAll("[required]"));
  const emailField = contactForm.querySelector('input[name="email"]');
  const projectDetailsField = contactForm.querySelector('textarea[name="project_details"]');
  const note = contactForm.querySelector(".contact-form-note");

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const setInvalidState = (field, isInvalid) => {
    field.classList.toggle("is-invalid", isInvalid);
  };

  const validateField = (field) => {
    const value = field.value.trim();

    if (field.hasAttribute("required") && value.length === 0) {
      setInvalidState(field, true);
      return false;
    }

    if (field === emailField && value.length > 0 && !EMAIL_PATTERN.test(value)) {
      setInvalidState(field, true);
      return false;
    }

    if (field === projectDetailsField && value.length > 0 && value.length < 20) {
      setInvalidState(field, true);
      return false;
    }

    setInvalidState(field, false);
    return true;
  };

  const validateForm = () => requiredFields.every((field) => validateField(field));

  requiredFields.forEach((field) => {
    field.addEventListener("input", () => {
      validateField(field);
    });

    field.addEventListener("blur", () => {
      validateField(field);
    });
  });

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const isValid = validateForm();

    if (!isValid) {
      const firstInvalid = contactForm.querySelector(".is-invalid");

      if (firstInvalid) {
        firstInvalid.focus();
      }

      return;
    }

    if (note) {
      note.textContent = "Merci, votre demande est prete pour integration backend/API.";
    }
  });
});
