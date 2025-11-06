import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.titan.email",
  port: Number.parseInt(process.env.SMTP_PORT || "587", 10),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || "woef@doya.dog",
    pass: process.env.SMTP_PASS || "%QB36FFA4O",
  },
});

export type EmailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
};

export async function sendEmail(options: EmailOptions): Promise<void> {
  const from = options.from || process.env.CONTACT_TO || "woef@doya.dog";
  
  await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html || options.text,
  });
}

export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error("Email configuration error:", error);
    return false;
  }
}


