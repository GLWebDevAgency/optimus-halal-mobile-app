/**
 * Génère un fichier HTML de preview avec les 5 templates email
 * Usage: npx tsx scripts/generate-email-preview.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  waitlistConfirmationEmail,
  welcomeEmail,
  passwordResetEmail,
  accountDeletionEmail,
  launchNotificationEmail,
} from "../src/services/email-templates.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Générer les templates
const templates = {
  WAITLIST_PLACEHOLDER: waitlistConfirmationEmail().html,
  WELCOME_PLACEHOLDER: welcomeEmail("Mehdi").html,
  RESET_PLACEHOLDER: passwordResetEmail("a4f29c").html,
  DELETION_PLACEHOLDER: accountDeletionEmail().html,
  LAUNCH_PLACEHOLDER: launchNotificationEmail().html,
};

// Lire le fichier de base
const previewPath = resolve(__dirname, "../../docs/mockups/email-preview.html");
let html = readFileSync(previewPath, "utf-8");

// Injecter les templates (échapper les ' pour srcdoc)
for (const [placeholder, content] of Object.entries(templates)) {
  const escaped = content.replace(/'/g, "&#39;").replace(/\n/g, " ");
  html = html.replace(placeholder, escaped);
}

// Écrire le fichier final
const outputPath = resolve(__dirname, "../../docs/mockups/email-preview-rendered.html");
writeFileSync(outputPath, html, "utf-8");

console.log(`\x1b[32m✓\x1b[0m Preview générée : ${outputPath}`);
console.log(`  Ouvre dans le navigateur pour visualiser les 5 templates.`);
