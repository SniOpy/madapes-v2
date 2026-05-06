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
  const submitButton = contactForm.querySelector('button[type="submit"]');

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
  const toPayload = () => {
    const formData = new FormData(contactForm);

    return {
      fullname: String(formData.get("fullname") || ""),
      email: String(formData.get("email") || ""),
      company: String(formData.get("company") || ""),
      website: String(formData.get("website") || ""),
      goal: String(formData.get("goal") || ""),
      project_details: String(formData.get("project_details") || ""),
      contact_website: String(formData.get("contact_website") || ""),
    };
  };

  const setNote = (message, isError = false) => {
    if (!note) {
      return;
    }

    note.textContent = message;
    note.classList.toggle("contact-form-note--error", isError);
    note.classList.toggle("contact-form-note--success", !isError);
  };

  requiredFields.forEach((field) => {
    field.addEventListener("input", () => {
      validateField(field);
    });

    field.addEventListener("blur", () => {
      validateField(field);
    });
  });

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const isValid = validateForm();

    if (!isValid) {
      const firstInvalid = contactForm.querySelector(".is-invalid");

      if (firstInvalid) {
        firstInvalid.focus();
      }

      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload()),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const fallbackError = "Une erreur est survenue. Merci de réessayer.";
        const firstError = Array.isArray(result.errors) && result.errors.length > 0 ? result.errors[0] : fallbackError;
        setNote(firstError, true);
        return;
      }

      contactForm.reset();
      requiredFields.forEach((field) => setInvalidState(field, false));
      setNote("Merci, votre demande a bien été envoyée. Nous revenons vers vous rapidement.");
    } catch {
      setNote("Impossible d'envoyer le formulaire pour le moment. Merci de réessayer.", true);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
});
