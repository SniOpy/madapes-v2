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
  const submitButtonInitialText = submitButton?.textContent?.trim() || "Envoyer";
  const noteTextElement = note
    ? note.querySelector("[data-form-message-text]") || (() => {
        const textSpan = document.createElement("span");
        textSpan.setAttribute("data-form-message-text", "");
        textSpan.textContent = note.textContent.trim();
        note.textContent = "";
        note.appendChild(textSpan);
        return textSpan;
      })()
    : null;

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

  const setSubmitState = (isLoading) => {
    if (!submitButton) {
      return;
    }

    submitButton.disabled = isLoading;
    submitButton.setAttribute("aria-busy", isLoading ? "true" : "false");
    submitButton.textContent = isLoading ? "Envoi en cours..." : submitButtonInitialText;
  };

  const toPayload = () => {
    const formData = new FormData(contactForm);
    const fullName = String(formData.get("fullname") || "");
    const email = String(formData.get("email") || "");
    const companyName = String(formData.get("company") || "");
    const rawWebsite = String(formData.get("website") || "").trim();
    const serviceType = String(formData.get("goal") || "");
    const projectDescription = String(formData.get("project_details") || "");
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
      goal: serviceType,
      projectGoal: serviceType,
      projectDescription,
      project_details: projectDescription,
      contact_website: honeypot,
    };
  };

  const setNote = (message, isError = false) => {
    if (!note || !noteTextElement) {
      return;
    }

    noteTextElement.textContent = message;
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
        setNote(safeMessage, true);
        return;
      }

      contactForm.reset();
      requiredFields.forEach((field) => setInvalidState(field, false));
      setNote("Merci, votre demande a bien ete envoyee. Nous revenons vers vous rapidement.");
    } catch (error) {
      if (error?.name === "AbortError") {
        setNote("Le delai d'envoi est depasse. Merci de reessayer dans quelques secondes.", true);
        return;
      }
      setNote("Impossible d'envoyer le formulaire pour le moment. Merci de reessayer.", true);
    } finally {
      if (requestTimeoutId) {
        window.clearTimeout(requestTimeoutId);
      }
      setSubmitState(false);
    }
  });
});
