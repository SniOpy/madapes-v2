(function () {
  "use strict";

  var ICONS = {
    success:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>',
    error:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  };

  var stack = null;
  var hideTimer = null;
  var progressAnim = null;

  function getStack() {
    if (stack) {
      return stack;
    }
    stack = document.createElement("div");
    stack.className = "form-toast-stack";
    stack.setAttribute("aria-live", "polite");
    document.body.appendChild(stack);
    return stack;
  }

  function clearTimers() {
    if (hideTimer) {
      window.clearTimeout(hideTimer);
      hideTimer = null;
    }
    if (progressAnim) {
      window.cancelAnimationFrame(progressAnim);
      progressAnim = null;
    }
  }

  function dismiss(toast) {
    if (!toast || toast.classList.contains("is-leaving")) {
      return;
    }
    clearTimers();
    toast.classList.remove("is-visible");
    toast.classList.add("is-leaving");
    window.setTimeout(function () {
      toast.remove();
    }, 350);
  }

  function show(options) {
    var type = options && options.type === "error" ? "error" : "success";
    var title =
      (options && options.title) ||
      (type === "success" ? "Demande envoyée" : "Envoi impossible");
    var message = (options && options.message) || "";
    var duration = typeof options?.duration === "number" ? options.duration : type === "success" ? 5200 : 6500;

    var container = getStack();
    var existing = container.querySelector(".form-toast");

    if (existing) {
      dismiss(existing);
    }

    clearTimers();

    var toast = document.createElement("div");
    toast.className = "form-toast form-toast--" + type;
    toast.setAttribute("role", type === "error" ? "alert" : "status");
    toast.innerHTML =
      '<span class="form-toast__icon">' +
      ICONS[type] +
      "</span>" +
      '<div class="form-toast__body">' +
      '<p class="form-toast__title"></p>' +
      '<p class="form-toast__message"></p>' +
      "</div>" +
      '<button type="button" class="form-toast__close" aria-label="Fermer la notification">' +
      ICONS.close +
      "</button>" +
      '<div class="form-toast__progress" aria-hidden="true"><i></i></div>';

    toast.querySelector(".form-toast__title").textContent = title;
    toast.querySelector(".form-toast__message").textContent = message;

    toast.querySelector(".form-toast__close").addEventListener("click", function () {
      dismiss(toast);
    });

    container.appendChild(toast);

    window.requestAnimationFrame(function () {
      toast.classList.add("is-visible");
    });

    var progressBar = toast.querySelector(".form-toast__progress i");
    if (progressBar && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      progressBar.style.transition = "transform " + duration + "ms linear";
      window.requestAnimationFrame(function () {
        progressBar.style.transform = "scaleX(0)";
      });
    }

    hideTimer = window.setTimeout(function () {
      dismiss(toast);
    }, duration);

    return toast;
  }

  window.MadapesFormToast = { show: show, dismiss: dismiss };
})();
