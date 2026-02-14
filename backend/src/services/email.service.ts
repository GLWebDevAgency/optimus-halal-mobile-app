import { env } from "../lib/env.js";
import { logger } from "../lib/logger.js";

interface SendEmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  if (!env.BREVO_API_KEY) {
    logger.warn("BREVO_API_KEY non configurée — email ignoré");
    return false;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: env.BREVO_SENDER_NAME, email: env.BREVO_SENDER_EMAIL },
        to: [{ email: options.to }],
        subject: options.subject,
        htmlContent: options.htmlContent,
        textContent: options.textContent,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      logger.error("Erreur API Brevo", { status: response.status, body });
      return false;
    }

    return true;
  } catch (err) {
    logger.error("Erreur réseau email", { error: err instanceof Error ? err.message : String(err) });
    return false;
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetCode: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "Réinitialisation de votre mot de passe - Optimus Halal",
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d7a3e;">Optimus Halal</h2>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>Votre code de vérification :</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #2d7a3e;">
          ${resetCode}
        </div>
        <p style="color: #666; font-size: 14px;">Ce code expire dans 15 minutes.</p>
        <p style="color: #666; font-size: 14px;">Si vous n'avez pas fait cette demande, ignorez cet email.</p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(
  email: string,
  displayName: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "Bienvenue sur Optimus Halal !",
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d7a3e;">Bienvenue ${displayName} !</h2>
        <p>Merci de rejoindre la communauté Optimus Halal.</p>
        <p>Commencez dès maintenant à scanner vos produits et découvrez leur statut halal en un instant.</p>
        <p style="color: #2d7a3e; font-weight: bold;">L'équipe Optimus Halal</p>
      </div>
    `,
  });
}
