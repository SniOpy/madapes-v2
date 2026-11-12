/* Madapes V2 — filtres de la page Réalisations */
"use strict";
(function () {
  const { $$ } = window.MadapesV2;
  const btns = $$(".v2-filter"), cards = $$(".v2-pcard");
  btns.forEach((b) =>
    b.addEventListener("click", () => {
      const f = b.dataset.filter;
      btns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      cards.forEach((c) => (c.hidden = f !== "all" && c.dataset.type !== f));
    })
  );
})();
