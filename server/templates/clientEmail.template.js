const escapeHtml = (value) => {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const normalizeFieldValue = (value) => {
  const cleanedValue = String(value ?? "").trim();
  return cleanedValue ? escapeHtml(cleanedValue) : "Non renseigné";
};

const resolveSiteBaseUrl = () => {
  const baseUrl = process.env.SITE_BASE_URL || "https://madapes-agency.com";
  return baseUrl.replace(/\/+$/, "");
};

const resolveFirstName = (fullName) => {
  const cleanedName = String(fullName ?? "").trim();
  if (!cleanedName) {
    return "Bonjour";
  }

  return escapeHtml(cleanedName.split(/\s+/)[0]);
};

const resolveFormSource = (formData) => {
  const source = String(formData.formSource ?? "").trim().toLowerCase();
  return source === "devis" ? "devis" : "contact";
};

const buildClientSummaryRows = (formData) => {
  const rows = [
    ["Nom", normalizeFieldValue(formData.fullName)],
    ["Prestation", normalizeFieldValue(formData.serviceType)],
    ["Budget", normalizeFieldValue(formData.budget)],
    ["Objectif", normalizeFieldValue(formData.projectGoal)],
    ["Description", normalizeFieldValue(formData.projectDescription)],
    ["Délai souhaité", normalizeFieldValue(formData.startDelay)],
  ].filter(([, value]) => value !== "Non renseigné");

  return rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding: 14px 16px; border-bottom: 1px solid rgba(124, 58, 237, 0.12); font-size: 12px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #7C3AED; width: 34%; vertical-align: top;">
            ${label}
          </td>
          <td style="padding: 14px 16px; border-bottom: 1px solid rgba(124, 58, 237, 0.12); font-size: 15px; line-height: 1.55; color: #1F1233; white-space: pre-wrap; vertical-align: top;">
            ${value}
          </td>
        </tr>
      `,
    )
    .join("");
};

const buildNextSteps = (formSource) => {
  const steps =
    formSource === "devis"
      ? [
          ["01", "Analyse de votre brief", "Nous étudions vos objectifs, votre budget et vos contraintes."],
          ["02", "Proposition sur mesure", "Vous recevez une recommandation claire et un devis adapté."],
          ["03", "Échange stratégique", "Nous affinons ensemble la meilleure approche pour votre projet."],
        ]
      : [
          ["01", "Prise en charge", "Nous analysons votre demande et le contexte de votre projet."],
          ["02", "Retour personnalisé", "Un membre de l'équipe revient vers vous avec des recommandations."],
          ["03", "Prochaine étape", "Nous planifions un échange pour avancer concrètement."],
        ];

  return steps
    .map(
      ([number, title, description]) => `
        <tr>
          <td style="padding-bottom: 10px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #F8F5FF; border: 1px solid rgba(124, 58, 237, 0.14); border-radius: 14px;">
              <tr>
                <td style="padding: 16px;">
                  <p style="margin: 0 0 8px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; color: #A855F7;">${number}</p>
                  <p style="margin: 0 0 6px; font-size: 14px; font-weight: 700; line-height: 1.35; color: #1F1233;">${title}</p>
                  <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #5B4A73;">${description}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `,
    )
    .join("");
};

export const buildClientEmailHtml = (formData) => {
  const formSource = resolveFormSource(formData);
  const safeFirstName = resolveFirstName(formData.fullName);
  const siteBaseUrl = resolveSiteBaseUrl();
  const logoUrl = `${siteBaseUrl}/assets/images/logo.svg`;
  const fallbackLogoUrl = `${siteBaseUrl}/assets/images/logo.png`;
  const summaryRows = buildClientSummaryRows(formData);
  const nextSteps = buildNextSteps(formSource);
  const isDevis = formSource === "devis";
  const heroTitle = isDevis
    ? `Merci ${safeFirstName}, votre demande de devis est bien reçue.`
    : `Merci ${safeFirstName}, votre demande est bien reçue.`;
  const introText = isDevis
    ? "Nous avons bien reçu votre demande de devis. Notre équipe l'étudie et revient vers vous sous <strong style=\"color:#FFFFFF;\">24h ouvrées</strong> avec une proposition adaptée."
    : "Nous avons bien reçu votre message. Notre équipe revient vers vous sous <strong style=\"color:#FFFFFF;\">24h ouvrées</strong> pour faire le point sur votre projet.";
  const ctaLabel = isDevis ? "Découvrir nos offres" : "Voir nos réalisations";
  const ctaUrl = isDevis ? `${siteBaseUrl}/offres` : siteBaseUrl;
  const preheader = isDevis
    ? "Votre demande de devis a bien été transmise. Réponse sous 24h ouvrées."
    : "Votre demande a bien été transmise. Réponse sous 24h ouvrées.";

  return `
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Confirmation Madapes Agency</title>
      </head>
      <body style="margin: 0; padding: 0; background: #0B0B0D; font-family: 'Segoe UI', Arial, Helvetica, sans-serif; color: #FFFFFF;">
        <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">
          ${preheader}
        </div>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #0B0B0D;">
          <tr>
            <td style="padding: 32px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 640px; margin: 0 auto;">
                <tr>
                  <td style="padding-bottom: 24px; text-align: center;">
                    <a href="${siteBaseUrl}" target="_blank" rel="noreferrer" style="text-decoration: none;">
                      <img
                        src="${logoUrl}"
                        alt="Madapes Agency"
                        width="168"
                        style="display: inline-block; max-width: 168px; height: auto;"
                        onerror="this.onerror=null;this.src='${fallbackLogoUrl}';"
                      />
                    </a>
                  </td>
                </tr>

                <tr>
                  <td style="border-radius: 22px; overflow: hidden; border: 1px solid rgba(168, 85, 247, 0.28); box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 28px 28px 24px; background: linear-gradient(135deg, #7C3AED 0%, #4C1D95 55%, #2E1065 100%);">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="52" style="vertical-align: top; padding-right: 14px;">
                                <div style="width: 48px; height: 48px; border-radius: 14px; background: rgba(255, 255, 255, 0.12); border: 1px solid rgba(255, 255, 255, 0.18); text-align: center; line-height: 48px; font-size: 22px;">
                                  ✓
                                </div>
                              </td>
                              <td style="vertical-align: top;">
                                <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255, 255, 255, 0.78);">
                                  Confirmation de demande
                                </p>
                                <h1 style="margin: 0; font-size: 24px; line-height: 1.35; font-weight: 700; color: #FFFFFF;">
                                  ${heroTitle}
                                </h1>
                              </td>
                            </tr>
                          </table>
                          <p style="margin: 18px 0 0; font-size: 15px; line-height: 1.65; color: rgba(255, 255, 255, 0.88);">
                            ${introText}
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding: 28px; background: #FFFFFF;">
                          <p style="margin: 0 0 14px; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #7C3AED;">
                            Prochaines étapes
                          </p>
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                            ${nextSteps}
                          </table>

                          <p style="margin: 0 0 12px; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #7C3AED;">
                            Récapitulatif de votre brief
                          </p>

                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background: #FCFAFF; border: 1px solid rgba(124, 58, 237, 0.14); border-radius: 16px; overflow: hidden; margin-bottom: 24px;">
                            ${summaryRows}
                          </table>

                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="text-align: center;">
                                <a
                                  href="${ctaUrl}"
                                  target="_blank"
                                  rel="noreferrer"
                                  style="display: inline-block; background: linear-gradient(135deg, #7C3AED 0%, #A855F7 100%); color: #FFFFFF; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 24px; border-radius: 12px; box-shadow: 0 10px 24px rgba(124, 58, 237, 0.28);"
                                >
                                  ${ctaLabel}
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 22px 8px 0; text-align: center;">
                    <p style="margin: 0; color: #8B8799; font-size: 12px; line-height: 1.6;">
                      Madapes Agency · Google Ads · Landing Pages · SEO
                    </p>
                    <p style="margin: 8px 0 0; color: #6B6678; font-size: 12px; line-height: 1.6;">
                      <a href="mailto:contact@madapes-agency.com" style="color: #C4B5FD; text-decoration: none;">contact@madapes-agency.com</a>
                      ·
                      <a href="${siteBaseUrl}" style="color: #C4B5FD; text-decoration: none;">madapes-agency.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

export const buildClientEmailSubject = (formData) => {
  const formSource = resolveFormSource(formData);

  if (formSource === "devis") {
    return "Votre demande de devis est bien reçue — Madapes Agency";
  }

  return "Votre demande est bien reçue — Madapes Agency";
};
