import "./load-env.js";
import app from "./app.js";
import { verifyMailTransporter } from "./config/mail.config.js";
import { shouldUseResendAsPrimaryProvider } from "./services/mail.service.js";

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`Madapes server ready on http://localhost:${port}`);

  if (shouldUseResendAsPrimaryProvider()) {
    console.log("Mail provider: Resend");
    return;
  }

  verifyMailTransporter()
    .then(() => {
      console.log("Mail provider: SMTP (connection verified)");
    })
    .catch((error) => {
      console.error("Mail transporter check failed at startup");
      console.error({
        message: error?.message,
        code: error?.code,
        responseCode: error?.responseCode,
      });
    });
});
