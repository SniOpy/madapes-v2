import { sendAdminNotificationEmail, sendClientConfirmationEmail } from "../services/mail.service.js";
import { buildAdminEmailHtml } from "../templates/adminEmail.template.js";
import { buildClientEmailHtml } from "../templates/clientEmail.template.js";

const normalizeEmail = (value) => String(value ?? "").trim().toLowerCase();

export const handleContactFormSubmission = async (req, res) => {
  try {
    const formData = req.validatedContactData || req.body;
    const clientEmail = normalizeEmail(formData.email);
    const serviceType = String(formData.serviceType ?? "").trim() || "Demande";

    const adminSubject = `Nouveau lead Madapes Agency - ${serviceType}`;
    const clientSubject = "Nous avons bien recu votre demande - Madapes Agency";

    await sendAdminNotificationEmail({
      subject: adminSubject,
      html: buildAdminEmailHtml(formData),
      replyTo: clientEmail,
    });

    await sendClientConfirmationEmail({
      to: clientEmail,
      subject: clientSubject,
      html: buildClientEmailHtml(formData),
    });

    return res.status(200).json({
      success: true,
      message: "Votre demande a bien ete envoyee.",
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Une erreur est survenue. Merci de reessayer.",
    });
  }
};
