import { env } from "../lib/env.js";
import { logger } from "../lib/logger.js";
import {
  waitlistConfirmationEmail,
  welcomeEmail,
  passwordResetEmail,
  accountDeletionEmail,
  launchNotificationEmail,
  trialReminderEmail,
  trialExpiredEmail,
} from "./email-templates.js";

// ---------------------------------------------------------------------------
// Core send — Brevo transactional API
// ---------------------------------------------------------------------------

interface SendEmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  if (!env.BREVO_API_KEY) {
    logger.warn("BREVO_API_KEY non configurée — email ignoré", {
      to: options.to,
      subject: options.subject,
    });
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
      logger.error("Erreur API Brevo", {
        status: response.status,
        body,
        to: options.to,
      });
      return false;
    }

    logger.info("Email envoyé", { to: options.to, subject: options.subject });
    return true;
  } catch (err) {
    logger.error("Erreur réseau email", {
      error: err instanceof Error ? err.message : String(err),
      to: options.to,
    });
    return false;
  }
}

// ---------------------------------------------------------------------------
// Branded email functions
// ---------------------------------------------------------------------------

/** Confirmation d'inscription à la waitlist */
export async function sendWaitlistConfirmationEmail(
  email: string
): Promise<boolean> {
  const tpl = waitlistConfirmationEmail();
  return sendEmail({
    to: email,
    subject: tpl.subject,
    htmlContent: tpl.html,
    textContent: tpl.text,
  });
}

/** Bienvenue — création de compte + trial 7j Naqiy+ */
export async function sendWelcomeEmail(email: string): Promise<boolean> {
  const tpl = welcomeEmail();
  return sendEmail({
    to: email,
    subject: tpl.subject,
    htmlContent: tpl.html,
    textContent: tpl.text,
  });
}

/** Rappel trial J5 — il reste 2 jours de Naqiy+ */
export async function sendTrialReminderEmail(email: string): Promise<boolean> {
  const tpl = trialReminderEmail();
  return sendEmail({
    to: email,
    subject: tpl.subject,
    htmlContent: tpl.html,
    textContent: tpl.text,
  });
}

/** Trial expiré J7 — choix subscribe ou gratuit */
export async function sendTrialExpiredEmail(email: string): Promise<boolean> {
  const tpl = trialExpiredEmail();
  return sendEmail({
    to: email,
    subject: tpl.subject,
    htmlContent: tpl.html,
    textContent: tpl.text,
  });
}

/** Réinitialisation de mot de passe */
export async function sendPasswordResetEmail(
  email: string,
  resetCode: string
): Promise<boolean> {
  const tpl = passwordResetEmail(resetCode);
  return sendEmail({
    to: email,
    subject: tpl.subject,
    htmlContent: tpl.html,
    textContent: tpl.text,
  });
}

/** Confirmation de suppression de compte */
export async function sendAccountDeletionEmail(
  email: string
): Promise<boolean> {
  const tpl = accountDeletionEmail();
  return sendEmail({
    to: email,
    subject: tpl.subject,
    htmlContent: tpl.html,
    textContent: tpl.text,
  });
}

/** Notification de lancement — batch waitlist */
export async function sendLaunchNotificationEmail(
  email: string
): Promise<boolean> {
  const tpl = launchNotificationEmail();
  return sendEmail({
    to: email,
    subject: tpl.subject,
    htmlContent: tpl.html,
    textContent: tpl.text,
  });
}
