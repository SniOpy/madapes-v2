let mailTransporter = null;

export const getMailTransporter = () => mailTransporter;

export const setMailTransporter = (transporter) => {
  mailTransporter = transporter;
};
