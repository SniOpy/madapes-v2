import dotenv from "dotenv";
import app from "./app.js";
import { verifyMailTransporter } from "./config/mail.config.js";
import { shouldUseResendAsPrimaryProvider } from "./services/mail.service.js";

dotenv.config();

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  if (shouldUseResendAsPrimaryProvider()) {
    return;
  }

  verifyMailTransporter().catch((error) => {
    console.error("Mail transporter check failed at startup");
    console.error({
      message: error?.message,
      code: error?.code,
      responseCode: error?.responseCode,
    });
  });
});
