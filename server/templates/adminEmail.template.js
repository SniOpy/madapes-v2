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
  return cleanedValue ? escapeHtml(cleanedValue) : "Non renseigne";
};

const resolveSiteBaseUrl = () => {
  const baseUrl = process.env.SITE_BASE_URL || "https://madapes-agency.com";
  return baseUrl.replace(/\/+$/, "");
};

const buildSummaryRows = (formData) => {
  const receivedAt = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });

  const rows = [
    ["Nom", normalizeFieldValue(formData.fullName)],
    ["Email", normalizeFieldValue(formData.email)],
    ["Telephone", normalizeFieldValue(formData.phone)],
    ["Entreprise", normalizeFieldValue(formData.companyName)],
    ["Site web", normalizeFieldValue(formData.website)],
    ["Prestation choisie", normalizeFieldValue(formData.serviceType)],
    ["Budget", normalizeFieldValue(formData.budget)],
    ["Objectif", normalizeFieldValue(formData.projectGoal)],
    ["Description projet", normalizeFieldValue(formData.projectDescription)],
    ["Delai souhaite", normalizeFieldValue(formData.startDelay)],
    ["Date de reception", receivedAt],
  ];

  return rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; font-weight: 600; color: #111827; width: 35%;">
            ${label}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; color: #111827; white-space: pre-wrap;">
            ${value}
          </td>
        </tr>
      `,
    )
    .join("");
};

export const buildAdminEmailHtml = (formData) => {
  const safeEmail = normalizeFieldValue(formData.email);
  const rawEmail = String(formData.email || "").trim();
  const safeServiceType = normalizeFieldValue(formData.serviceType);
  const siteBaseUrl = resolveSiteBaseUrl();
  const logoUrl = `${siteBaseUrl}/assets/images/logo/logo.webp`;
  const fallbackLogoUrl = `${siteBaseUrl}/assets/images/logo/logo.webp`;
  const summaryRows = buildSummaryRows(formData);

  return `
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Nouveau lead Madapes Agency</title>
      </head>
      <body style="margin: 0; padding: 24px; background: #0B0B0D; font-family: Arial, Helvetica, sans-serif; color: #FFFFFF;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 760px; margin: 0 auto;">
          <tr>
            <td style="padding-bottom: 18px; text-align: center;">
              <a href="${siteBaseUrl}" target="_blank" rel="noreferrer" style="text-decoration: none;">
                <img
                  src="${logoUrl}"
                  alt="Madapes Agency"
                  width="170"
                  style="display: inline-block; max-width: 170px; height: auto;"
                  onerror="this.onerror=null;this.src='${fallbackLogoUrl}';"
                />
              </a>
            </td>
          </tr>
          <tr>
            <td style="background: #FFFFFF; border-radius: 16px; overflow: hidden;">
              <div style="padding: 24px; background: linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%); color: #FFFFFF;">
                <p style="margin: 0; font-size: 13px; letter-spacing: 0.8px; text-transform: uppercase; opacity: 0.92;">
                  🔥 Nouveau lead Madapes Agency
                </p>
                <h1 style="margin: 8px 0 0; font-size: 22px; line-height: 1.3; font-weight: 700;">
                  Demande: ${safeServiceType}
                </h1>
              </div>

              <div style="padding: 24px;">
                <p style="margin: 0 0 16px; color: #1F2937; font-size: 15px; line-height: 1.5;">
                  Une nouvelle demande est arrivee depuis le formulaire du site. Tu peux repondre directement au prospect via le bouton ci-dessous.
                </p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden;">
                  ${summaryRows}
                </table>

                <div style="padding-top: 22px; text-align: center;">
                  <a
                    href="mailto:${escapeHtml(rawEmail)}?subject=${encodeURIComponent("Re: Votre demande Madapes Agency")}"
                    style="display: inline-block; background: #7C3AED; color: #FFFFFF; text-decoration: none; font-weight: 700; padding: 12px 20px; border-radius: 10px;"
                  >
                    Repondre au client
                  </a>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 16px; text-align: center;">
              <p style="margin: 0; color: #A1A1AA; font-size: 12px;">
                Madapes Agency
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};
