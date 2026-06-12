(function () {
  "use strict";

  try {
    if (localStorage.getItem("madapes-theme") === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    }
  } catch (_error) {
    /* localStorage unavailable */
  }
})();
