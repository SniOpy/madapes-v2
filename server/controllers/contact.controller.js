import { sendAdminNotificationEmail, sendClientConfirmationEmail } from "../services/mail.service.js";
import { buildAdminEmailHtml } from "../templates/adminEmail.template.js";
import { buildClientEmailHtml, buildClientEmailSubject } from "../templates/clientEmail.template.js";

const normalizeEmail = (value) => String(value ?? "").trim().toLowerCase();

const resolveFormSource = (formData) => {
  const source = String(formData.formSource ?? "").trim().toLowerCase();
  return source === "devis" ? "devis" : "contact";
};

const resolveFirstName = (fullName) => {
  const cleanedName = String(fullName ?? "").trim();
  if (!cleanedName) {
    return "Prospect";
  }

  return cleanedName.split(/\s+/)[0];
};

const buildAdminEmailSubject = (formData) => {
  const formSource = resolveFormSource(formData);
  const serviceType = String(formData.serviceType ?? "").trim() || "Demande";
  const firstName = resolveFirstName(formData.fullName);
  const leadLabel = formSource === "devis" ? "Devis" : "Contact";

  return `🔥 ${leadLabel} · ${serviceType} — ${firstName}`;
};

export const handleContactFormSubmission = async (req, res) => {
  try {
    const formData = req.validatedContactData || req.body;
    const clientEmail = normalizeEmail(formData.email);

    await Promise.all([
      sendAdminNotificationEmail({
        subject: buildAdminEmailSubject(formData),
        html: buildAdminEmailHtml(formData),
        replyTo: clientEmail,
      }),
      sendClientConfirmationEmail({
        to: clientEmail,
        subject: buildClientEmailSubject(formData),
        html: buildClientEmailHtml(formData),
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Votre demande a bien ete envoyee.",
    });
  } catch (error) {
    console.error("Contact form email send failed");
    console.error({
      message: error?.message,
      code: error?.code,
      command: error?.command,
      response: error?.response,
      responseCode: error?.responseCode,
    });

    return res.status(500).json({
      success: false,
      message: "Le service email est temporairement indisponible. Merci de reessayer dans quelques instants.",
    });
  }
};
