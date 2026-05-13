"use strict";

/**
 * Préparation Stripe Checkout (acompte) — front uniquement.
 *
 * Les Price IDs Stripe ne doivent pas être des secrets côté navigateur :
 * le backend Node.js doit les lire en variables d'environnement, par ex. :
 *   STRIPE_STARTER_PRICE_ID
 *   STRIPE_GROWTH_PRICE_ID
 *
 * Le front envoie uniquement { tier: "starter" | "growth" } vers une route
 * qui crée une session Checkout et renvoie { url }.
 */

const STRIPE_CHECKOUT_ENDPOINT = "/api/create-checkout-session";

function handleStarterDeposit(event) {
  if (event) {
    event.preventDefault();
  }
  return requestStripeCheckoutSession("starter");
}

function handleGrowthDeposit(event) {
  if (event) {
    event.preventDefault();
  }
  return requestStripeCheckoutSession("growth");
}

async function requestStripeCheckoutSession(tier) {
  try {
    const response = await fetch(STRIPE_CHECKOUT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ tier }),
    });

    if (!response.ok) {
      throw new Error(`Checkout session failed: ${response.status}`);
    }

    const data = await response.json();
    if (data && typeof data.url === "string" && data.url.length > 0) {
      window.location.assign(data.url);
      return;
    }

    throw new Error("Missing checkout URL in response");
  } catch {
    window.location.assign("/contact#acompte");
  }
}

window.handleStarterDeposit = handleStarterDeposit;
window.handleGrowthDeposit = handleGrowthDeposit;

window.MadapesStripeCheckout = {
  handleStarterDeposit,
  handleGrowthDeposit,
  requestStripeCheckoutSession,
};
