/**
 * Naqiy — World-class branded email templates
 *
 * Design principles:
 *   1. Light theme — fond crème chaud, cartes blanches (fidèle au design system light)
 *   2. Typographie Nunito (headings) + Nunito Sans (body) via Google Fonts
 *   3. Or Naqiy #D4AF37 — signature brand, CTA, accents
 *   4. Vert feuille #4B7A38 — touches de nature/halal
 *   5. ZERO emoji — design typographique pur, gold dots pour les listes
 *   6. Communication : chaleureux, personnel, exclusif (tutoiement)
 *   7. Compatible : Gmail, Apple Mail, Outlook (VML fallbacks), Yahoo, mobile
 *   8. Tables layout, inline CSS, no CSS variables
 */

// ---------------------------------------------------------------------------
// Brand tokens — hex conversions exactes du design system OKLCH (light mode)
// ---------------------------------------------------------------------------

const B = {
  // Assets hosted on Cloudflare R2 CDN (reliable for email clients)
  cdn: "https://pub-f871593571bd4d04a86a25015aac1057.r2.dev",
  logo: "https://pub-f871593571bd4d04a86a25015aac1057.r2.dev/images/email/logo-full.png",
  iconBase: "https://pub-f871593571bd4d04a86a25015aac1057.r2.dev/images/email",
  site: "https://naqiy.app",
  instagram: "https://instagram.com/naqiyapp",

  // Surfaces (light mode — matching :root CSS variables)
  bgBody: "#F5F0E8", // fond crème chaud
  bgCard: "#FFFFFF", // blanc pur — cartes
  bgElevated: "#F9F7F3", // gris très subtil
  bgSurface: "#F0EDE6", // surface secondaire

  // Gold — brand signature
  gold: "#D4AF37", // oklch(0.76 0.14 88) — primary
  goldLight: "#D4B86A",
  goldDark: "#C08A18",
  goldSubtle: "#FDF8EC", // gold ~5% sur blanc
  goldBorder: "#E8D9A0", // bordure dorée subtile
  goldForeground: "#1C1808", // texte sur fond gold

  // Leaf — nature/halal
  leaf: "#4B7A38",
  leafSubtle: "#F0F7ED",

  // Text
  textPrimary: "#1C1B19", // oklch(0.12 0.01 90) — noir chaud
  textSecondary: "#6B6760", // oklch(0.46 0.02 90)
  textMuted: "#9B9689", // légal, footnotes

  // Structural
  divider: "#E8E5DE",
  border: "#E0DDD5",

  // Typography
  fontHeading:
    "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  fontBody:
    "'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  fontMono:
    "'SF Mono', 'Fira Code', 'Roboto Mono', 'Courier New', monospace",
} as const;

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Nunito+Sans:opsz,wght@6..12,400;6..12,600&display=swap";

// ---------------------------------------------------------------------------
// Base layout
// ---------------------------------------------------------------------------

interface LayoutOptions {
  preheader?: string;
}

function baseLayout(content: string, opts: LayoutOptions = {}): string {
  const preheader = opts.preheader
    ? `<div style="display:none;font-size:1px;color:${B.bgBody};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${opts.preheader}${"&zwnj;&nbsp;".repeat(50)}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <meta name="x-apple-disable-message-reformatting"/>
  <meta name="color-scheme" content="light"/>
  <meta name="supported-color-schemes" content="light"/>
  <title>Naqiy</title>
  <!--[if !mso]><!-->
  <link href="${GOOGLE_FONTS_URL}" rel="stylesheet"/>
  <!--<![endif]-->
  <!--[if mso]>
  <noscript><xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml></noscript>
  <![endif]-->
  <style>
    @import url('${GOOGLE_FONTS_URL}');
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: ${B.bgBody}; }
    :root { color-scheme: light; supported-color-schemes: light; }
    @media only screen and (max-width: 640px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .pad-mobile { padding-left: 24px !important; padding-right: 24px !important; }
      .h1-mobile { font-size: 24px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:${B.bgBody}; font-family:${B.fontBody}; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;">
  ${preheader}

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${B.bgBody};">
    <tr>
      <td align="center" style="padding: 48px 16px 24px;">
        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <a href="${B.site}" target="_blank" style="text-decoration:none;">
                <img src="${B.logo}" alt="Naqiy" width="140" style="display:block; width:140px; max-width:140px; height:auto; border-radius:14px;"/>
              </a>
            </td>
          </tr>

          <!-- Content card -->
          <tr>
            <td style="background-color:${B.bgCard}; border-radius:20px; border:1px solid ${B.border}; box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03); overflow:hidden;">
              <!-- Gold → Leaf accent bar -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="50%" style="height:2px; background-color:${B.gold}; font-size:1px; line-height:1px;">&nbsp;</td>
                  <td width="50%" style="height:2px; background-color:${B.leaf}; font-size:1px; line-height:1px;">&nbsp;</td>
                </tr>
              </table>
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 36px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom: 8px;">
                    <img src="${B.iconBase}/leaf.svg" alt="" width="20" height="20" style="display:inline-block; width:20px; height:20px;"/>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <span style="font-family:${B.fontHeading}; font-size:12px; font-weight:700; color:${B.gold}; letter-spacing:2px; text-transform:uppercase;">
                      Scanne <span style="color:${B.leaf};">&middot;</span> Comprends <span style="color:${B.leaf};">&middot;</span> Choisis
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <a href="${B.instagram}" target="_blank" style="display:inline-block; padding:8px 18px; background-color:${B.textPrimary}; border-radius:8px; text-decoration:none; font-family:${B.fontHeading}; font-size:12px; font-weight:700; color:${B.bgCard}; letter-spacing:0.2px;">
                      Instagram &rarr;
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family:${B.fontBody}; font-size:11px; line-height:20px; color:${B.textMuted}; padding-bottom: 8px;">
                    &copy; ${new Date().getFullYear()} Naqiy
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family:${B.fontBody}; font-size:11px; line-height:20px; color:${B.textMuted}; padding-bottom: 16px;">
                    <a href="${B.site}/confidentialite" target="_blank" style="color:${B.textMuted}; text-decoration:underline;">Confidentialit&eacute;</a>
                    &nbsp;&middot;&nbsp;
                    <a href="${B.site}/cgu" target="_blank" style="color:${B.textMuted}; text-decoration:underline;">CGU</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Reusable components
// ---------------------------------------------------------------------------

function goldButton(text: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
  <tr>
    <td align="center" style="border-radius:16px; background-color:${B.gold};">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:56px;v-text-anchor:middle;width:280px;" arcsize="29%" strokecolor="${B.gold}" fillcolor="${B.gold}">
        <w:anchorlock/><center style="color:${B.goldForeground};font-family:${B.fontHeading};font-size:16px;font-weight:bold;">${text}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="${href}" target="_blank" style="display:inline-block; padding:18px 52px; font-family:${B.fontHeading}; font-size:16px; font-weight:700; color:${B.goldForeground}; text-decoration:none; border-radius:16px; background-color:${B.gold}; line-height:1.2; letter-spacing:0.3px;">
        ${text}
      </a>
      <!--<![endif]-->
    </td>
  </tr>
</table>`;
}

function divider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding: 28px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="height:1px; background-color:${B.divider}; font-size:1px; line-height:1px;">&nbsp;</td></tr>
      </table>
    </td>
  </tr>
</table>`;
}

function heading(text: string, opts?: { size?: "lg" | "md" }): string {
  const fontSize = opts?.size === "md" ? "24px" : "32px";
  const mobileClass = opts?.size === "md" ? "" : "h1-mobile";
  return `<h1 class="${mobileClass}" style="margin:0 0 16px; font-family:${B.fontHeading}; font-size:${fontSize}; font-weight:800; color:${B.textPrimary}; line-height:1.2; letter-spacing:-0.6px;">
  ${text}
</h1>`;
}

function paragraph(text: string, opts?: { muted?: boolean; small?: boolean; center?: boolean }): string {
  const color = opts?.muted ? B.textMuted : B.textSecondary;
  const size = opts?.small ? "13px" : "16px";
  const lineHeight = opts?.small ? "21px" : "28px";
  const align = opts?.center ? "center" : "left";
  return `<p style="margin:0 0 18px; font-family:${B.fontBody}; font-size:${size}; line-height:${lineHeight}; color:${color}; text-align:${align};">
  ${text}
</p>`;
}

/** Feature item with Phosphor icon — variant: "gold" (default) or "leaf" (green) */
function featureItem(icon: string, label: string, description: string, variant: "gold" | "leaf" = "gold"): string {
  const iconUrl = `${B.iconBase}/${icon}.svg`;
  const bg = variant === "leaf" ? B.leafSubtle : B.goldSubtle;
  const border = variant === "leaf" ? "#C8DFC0" : B.goldBorder;
  return `<tr>
  <td width="36" valign="top" style="padding: 2px 12px 18px 0;">
    <div style="width:32px; height:32px; border-radius:10px; background-color:${bg}; border:1px solid ${border}; text-align:center; line-height:32px;">
      <img src="${iconUrl}" alt="" width="18" height="18" style="display:inline-block; vertical-align:middle; width:18px; height:18px;"/>
    </div>
  </td>
  <td valign="top" style="padding: 2px 0 18px; font-family:${B.fontBody}; font-size:14px; line-height:22px; color:${B.textSecondary};">
    <span style="font-family:${B.fontHeading}; font-weight:700; color:${B.textPrimary}; font-size:14px;">${label}</span><br/>
    ${description}
  </td>
</tr>`;
}

/** Numbered step item — alternates gold (odd) and leaf (even) */
function stepItem(num: number, label: string, description: string): string {
  const isLeaf = num % 2 === 0;
  const bg = isLeaf ? B.leafSubtle : B.goldSubtle;
  const border = isLeaf ? "#C8DFC0" : B.goldBorder;
  const color = isLeaf ? B.leaf : B.gold;
  return `<tr>
  <td width="36" valign="top" style="padding: 0 12px 18px 0;">
    <div style="width:28px; height:28px; border-radius:8px; background-color:${bg}; border:1px solid ${border}; text-align:center; line-height:28px; font-family:${B.fontHeading}; font-size:13px; font-weight:800; color:${color};">
      ${num}
    </div>
  </td>
  <td valign="top" style="padding: 2px 0 18px; font-family:${B.fontBody}; font-size:14px; line-height:22px; color:${B.textSecondary};">
    <span style="font-family:${B.fontHeading}; font-weight:700; color:${B.textPrimary}; font-size:14px;">${label}</span><br/>
    ${description}
  </td>
</tr>`;
}

/** Stat counter */
function statItem(value: string, label: string): string {
  return `<td align="center" style="padding: 0 8px;">
  <span style="display:block; font-family:${B.fontHeading}; font-size:22px; font-weight:800; color:${B.textPrimary}; line-height:1.2;">${value}</span>
  <span style="display:block; font-family:${B.fontBody}; font-size:11px; color:${B.textMuted}; line-height:1.4; padding-top:4px;">${label}</span>
</td>`;
}

/** Instagram CTA section — for waitlist, welcome, launch emails */
function instagramSection(): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="pad-mobile" style="padding: 0 44px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${B.leafSubtle}; border-radius:16px; border:1px solid #C8DFC0;">
            <tr>
              <td style="padding: 28px 24px; text-align:center;">

                <!-- Leaf icon -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 12px;">
                  <tr>
                    <td>
                      <img src="${B.iconBase}/leaf.svg" alt="" width="22" height="22" style="display:block; width:22px; height:22px;"/>
                    </td>
                  </tr>
                </table>

                <!-- Heading -->
                <p style="margin:0 0 16px; font-family:${B.fontHeading}; font-size:15px; font-weight:700; color:${B.leaf}; line-height:1.4;">
                  Suis notre aventure
                </p>

                <!-- Instagram button -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 16px;">
                  <tr>
                    <td align="center" style="border-radius:12px; background-color:${B.textPrimary};">
                      <a href="${B.instagram}" target="_blank" style="display:inline-block; padding:12px 28px; font-family:${B.fontHeading}; font-size:14px; font-weight:700; color:${B.bgCard}; text-decoration:none; border-radius:12px; background-color:${B.textPrimary}; line-height:1.2; letter-spacing:0.2px;">
                        @naqiyapp
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Subtitle -->
                <p style="margin:0; font-family:${B.fontBody}; font-size:12px; line-height:18px; color:${B.textMuted};">
                  Coulisses, conseils halal et nouveaut&eacute;s en avant-premi&egrave;re.
                </p>

              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

/** NaqiyScore preview — faithful reproduction of landing page design */
function scorePreview(): string {
  // Exact colors from landing: TRUST_GRADES
  const grades = [
    { arabic: "&#x661;", color: "#22c55e", active: true },  // ١ green — active
    { arabic: "&#x662;", color: "#84cc16", active: false }, // ٢ lime
    { arabic: "&#x663;", color: "#f59e0b", active: false }, // ٣ amber
    { arabic: "&#x664;", color: "#f97316", active: false }, // ٤ orange
    { arabic: "&#x665;", color: "#ef4444", active: false }, // ٥ red
  ];

  const gradeBadges = grades.map((g) => {
    const w = g.active ? 44 : 26;
    const h = g.active ? 28 : 22;
    const fs = g.active ? 16 : 11;
    const opacity = g.active ? "1" : "0.2";
    return `<td align="center" style="padding:0 3px;">
      <div style="display:inline-block; width:${w}px; height:${h}px; border-radius:8px; background-color:${g.color}; opacity:${opacity}; text-align:center; line-height:${h}px;">
        <span style="font-family:${B.fontHeading}; font-size:${fs}px; font-weight:900; color:#FFFFFF;">${g.arabic}</span>
      </div>
    </td>`;
  }).join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="pad-mobile" style="padding: 0 44px;">
          <p style="margin:0 0 16px; font-family:${B.fontHeading}; font-size:16px; font-weight:700; color:${B.textPrimary}; line-height:1.4;">
            Un aper&ccedil;u de l&rsquo;analyse Naqiy
          </p>

          <!-- NaqiyScore HALAL — N + Arabic grade strip -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${B.bgElevated}; border-radius:16px; border:1px solid ${B.divider}; margin-bottom:12px;">
            <tr>
              <td style="padding: 20px 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <!-- N logo letter -->
                    <td width="28" valign="middle" style="padding-right:12px;">
                      <span style="font-family:${B.fontHeading}; font-size:22px; font-weight:900; color:${B.gold};">N</span>
                    </td>
                    <!-- Grade badges strip -->
                    ${gradeBadges}
                    <!-- Label -->
                    <td valign="middle" style="padding-left:14px;">
                      <span style="font-family:${B.fontHeading}; font-size:15px; font-weight:700; color:#22c55e;">
                        Tr&egrave;s fiable
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- NaqiyScore SANTÉ — Circle + Score /100 -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${B.bgElevated}; border-radius:16px; border:1px solid ${B.divider};">
            <tr>
              <td style="padding: 20px 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <!-- Score circle -->
                    <td width="64" valign="middle" style="padding-right:16px;">
                      <div style="display:inline-block; width:56px; height:56px; border-radius:50%; border:4px solid #22c55e; text-align:center;">
                        <span style="font-family:${B.fontHeading}; font-size:22px; font-weight:900; color:#22c55e; line-height:48px; display:block;">68</span>
                        <span style="font-family:${B.fontBody}; font-size:10px; color:${B.textMuted}; display:block; margin-top:-8px;">/100</span>
                      </div>
                    </td>
                    <!-- Label -->
                    <td valign="middle">
                      <span style="font-family:${B.fontHeading}; font-size:16px; font-weight:800; color:#22c55e; display:block; line-height:1.3;">
                        BON
                      </span>
                      <span style="font-family:${B.fontBody}; font-size:13px; color:${B.textSecondary}; display:block; line-height:1.4;">
                        Score Naqiy Sant&eacute;
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>`;
}

/** Deletion item with muted dot */
function deletionItem(text: string): string {
  return `<tr>
  <td width="24" valign="top" style="padding: 2px 12px 12px 0;">
    <div style="width:6px; height:6px; border-radius:3px; background-color:${B.textMuted}; margin-top:8px;"></div>
  </td>
  <td valign="top" style="padding: 0 0 12px; font-family:${B.fontBody}; font-size:14px; line-height:22px; color:${B.textSecondary};">
    ${text}
  </td>
</tr>`;
}

// ---------------------------------------------------------------------------
// 1. WAITLIST CONFIRMATION
// ---------------------------------------------------------------------------

export function waitlistConfirmationEmail(): {
  subject: string;
  html: string;
  text: string;
} {
  const content = `
    <!-- Hero -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="pad-mobile" style="padding: 44px 44px 0; text-align:center;">

          <!-- Confirmed badge -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 24px;">
            <tr>
              <td style="padding:6px 18px; background-color:${B.goldSubtle}; border:1px solid ${B.goldBorder}; border-radius:24px;">
                <span style="font-family:${B.fontBody}; font-size:12px; font-weight:600; color:${B.gold}; letter-spacing:0.8px; text-transform:uppercase;">
                  Inscription confirm&eacute;e
                </span>
              </td>
            </tr>
          </table>

          ${heading("Tu es sur la liste.")}
          ${paragraph("Merci d&rsquo;avoir rejoint Naqiy. Tu fais d&eacute;sormais partie de ceux qui veulent une alimentation halal <strong style=\"color:" + B.textPrimary + "\">transparente</strong>, <strong style=\"color:" + B.textPrimary + "\">v&eacute;rifiable</strong> et <strong style=\"color:" + B.textPrimary + "\">personnalis&eacute;e</strong>.", { center: true })}
        </td>
      </tr>
    </table>

    <!-- Stats -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="pad-mobile" style="padding: 4px 44px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${B.bgElevated}; border-radius:14px; border:1px solid ${B.divider};">
            <tr>
              <td style="padding: 20px 8px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    ${statItem("817K+", "Produits")}
                    ${statItem("4", "&Eacute;coles")}
                    ${statItem("383", "Commerces")}
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Features -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="pad-mobile" style="padding: 8px 44px 0;">
          ${divider()}
          <p style="margin:0 0 20px; font-family:${B.fontHeading}; font-size:16px; font-weight:700; color:${B.textPrimary}; line-height:1.4;">
            Ce que Naqiy va changer pour toi
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${featureItem("scan", "Scan instantan&eacute;", "Pointe la cam&eacute;ra, d&eacute;couvre le verdict halal en&nbsp;1&nbsp;seconde.")}
            ${featureItem("madhab", "Ton madhab, ton verdict", "Hanafi, Shafi&rsquo;i, Maliki ou Hanbali &mdash; le r&eacute;sultat s&rsquo;adapte &agrave; toi.")}
            ${featureItem("health", "Analyse sant&eacute; compl&egrave;te", "NutriScore, additifs, NOVA &mdash; le halal ne suffit pas, le tayyib aussi.", "leaf")}
            ${featureItem("map", "Carte des commerces halal", "Les certifi&eacute;s pr&egrave;s de chez toi, avec avis et horaires.", "leaf")}
          </table>
        </td>
      </tr>
    </table>

    <!-- Score Preview -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding: 0 0;">${divider()}</td></tr>
    </table>
    ${scorePreview()}

    <!-- CTA -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding: 28px 44px 12px; text-align:center;">
          ${goldButton("D&eacute;couvrir Naqiy", B.site)}
        </td>
      </tr>
    </table>

    <!-- Instagram -->
    ${instagramSection()}

    <!-- Promise -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="pad-mobile" style="padding: 20px 44px 44px; text-align:center;">
          ${paragraph("Pas de spam &mdash; juste un email le jour du lancement.", { muted: true, small: true, center: true })}
        </td>
      </tr>
    </table>
  `;

  return {
    subject: "Tu es sur la liste Naqiy",
    html: baseLayout(content, {
      preheader: "Tu es inscrit ! On te pr\u00e9vient d\u00e8s que l\u2019app est disponible.",
    }),
    text: `Assalamu alaykum. Tu es sur la liste Naqiy.

Merci d'avoir rejoint Naqiy. Tu fais désormais partie de ceux qui veulent une alimentation halal transparente, vérifiable et personnalisée.

Naqiy en chiffres :
- 817 000+ produits analysés
- 4 écoles juridiques (Hanafi, Shafi'i, Maliki, Hanbali)
- 383 commerces halal certifiés

Ce que Naqiy va changer pour toi :

- Scan instantané — Pointe la caméra, découvre le verdict halal en 1 seconde.
- Ton madhab, ton verdict — Hanafi, Shafi'i, Maliki ou Hanbali.
- Analyse santé complète — NutriScore, additifs, NOVA.
- Carte des commerces halal — Les certifiés près de chez toi.

Découvre Naqiy : ${B.site}

Pas de spam — juste un email le jour du lancement.

---
Scanne. Comprends. Choisis.
naqiy.app`,
  };
}

// ---------------------------------------------------------------------------
// 2. WELCOME (inscription app — 7 jours trial Naqiy+)
// ---------------------------------------------------------------------------

export function welcomeEmail(): {
  subject: string;
  html: string;
  text: string;
} {
  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="pad-mobile" style="padding: 44px 44px 0; text-align:center;">

          <!-- Trial badge -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 24px;">
            <tr>
              <td style="padding:6px 18px; background-color:${B.leafSubtle}; border:1px solid #C8DFC0; border-radius:24px;">
                <span style="font-family:${B.fontBody}; font-size:12px; font-weight:600; color:${B.leaf}; letter-spacing:0.8px; text-transform:uppercase;">
                  7 jours offerts
                </span>
              </td>
            </tr>
          </table>

          ${heading("Assalamu alaykum.")}
          ${paragraph("Ton compte Naqiy est pr&ecirc;t &mdash; et on t&rsquo;offre <strong style=\"color:" + B.textPrimary + "\">7&nbsp;jours de Naqiy+</strong> pour d&eacute;couvrir toute la puissance de l&rsquo;app, sans engagement.", { center: true })}
        </td>
      </tr>
    </table>

    <!-- Naqiy+ benefits -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="pad-mobile" style="padding: 8px 44px 0;">
          ${divider()}
          <p style="margin:0 0 6px; font-family:${B.fontHeading}; font-size:16px; font-weight:700; color:${B.textPrimary}; line-height:1.4;">
            Ton acc&egrave;s Naqiy+ est actif
          </p>
          <p style="margin:0 0 20px; font-family:${B.fontBody}; font-size:13px; color:${B.textMuted}; line-height:1.5;">
            Pendant 7 jours, tu as acc&egrave;s &agrave; tout. Voici ce que tu d&eacute;bloques&nbsp;:
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${featureItem("scan", "Scans illimit&eacute;s", "Scanne autant de produits que tu veux, sans limite quotidienne.")}
            ${featureItem("madhab", "Analyse IA avanc&eacute;e", "Extraction d&rsquo;ingr&eacute;dients par intelligence artificielle pour les produits inconnus.")}
            ${featureItem("health", "Analyse sant&eacute; compl&egrave;te", "NutriScore, additifs, NOVA, allerg&egrave;nes &mdash; le tableau complet.", "leaf")}
            ${featureItem("star", "Acc&egrave;s prioritaire", "Nouvelles fonctionnalit&eacute;s en avant-premi&egrave;re et support d&eacute;di&eacute;.")}
          </table>
        </td>
      </tr>
    </table>

    <!-- Score Preview -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding: 0 0;">${divider()}</td></tr>
    </table>
    ${scorePreview()}

    <!-- Steps -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="pad-mobile" style="padding: 8px 44px 0;">
          ${divider()}
          <p style="margin:0 0 20px; font-family:${B.fontHeading}; font-size:16px; font-weight:700; color:${B.textPrimary}; line-height:1.4;">
            Commence en 30 secondes
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${stepItem(1, "Choisis ton madhab", "Hanafi, Shafi&rsquo;i, Maliki ou Hanbali &mdash; le verdict s&rsquo;adapte &agrave; toi.")}
            ${stepItem(2, "Scanne ton premier produit", "Pointe la cam&eacute;ra sur le code-barres. R&eacute;sultat en 1 seconde.")}
            ${stepItem(3, "D&eacute;couvre ton analyse compl&egrave;te", "Halal, sant&eacute;, additifs, NaqiyScore &mdash; tout est l&agrave;.")}
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding: 12px 44px 8px; text-align:center;">
          ${goldButton("Ouvrir Naqiy", B.site)}
        </td>
      </tr>
    </table>

    <!-- Reassurance -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="pad-mobile" style="padding: 12px 44px 0; text-align:center;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${B.bgElevated}; border-radius:12px; border:1px solid ${B.divider};">
            <tr>
              <td style="padding: 16px 20px; text-align:center;">
                <p style="margin:0; font-family:${B.fontBody}; font-size:13px; line-height:20px; color:${B.textSecondary};">
                  Apr&egrave;s 7 jours, tu gardes l&rsquo;acc&egrave;s <strong style="color:${B.textPrimary};">gratuit</strong> &agrave; toutes les fonctionnalit&eacute;s essentielles. Tu d&eacute;cides, sans pression.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Instagram -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding: 16px 0 0;">${divider()}</td>
      </tr>
    </table>
    ${instagramSection()}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="pad-mobile" style="padding: 20px 44px 44px; text-align:center;">
          ${paragraph("Bonne d&eacute;couverte.", { muted: true, small: true, center: true })}
          <p style="margin:0; font-family:${B.fontHeading}; font-size:14px; font-weight:700; color:${B.gold};">
            Naqiy
          </p>
        </td>
      </tr>
    </table>
  `;

  return {
    subject: "Bienvenue sur Naqiy \u2014 7 jours de Naqiy+ offerts",
    html: baseLayout(content, {
      preheader: "Ton compte est pr\u00eat. 7 jours de Naqiy+ offerts pour tout d\u00e9couvrir.",
    }),
    text: `Assalamu alaykum.

Ton compte Naqiy est prêt — et on t'offre 7 jours de Naqiy+ pour découvrir toute la puissance de l'app, sans engagement.

TON ACCÈS NAQIY+ EST ACTIF

Pendant 7 jours, tu as accès à tout :

- Scans illimités — Scanne autant de produits que tu veux.
- Analyse IA avancée — Extraction d'ingrédients par intelligence artificielle.
- Analyse santé complète — NutriScore, additifs, NOVA, allergènes.
- Accès prioritaire — Nouvelles fonctionnalités en avant-première.

COMMENCE EN 30 SECONDES

1. Choisis ton madhab — Hanafi, Shafi'i, Maliki ou Hanbali.
2. Scanne ton premier produit — Résultat en 1 seconde.
3. Découvre ton analyse complète — Halal, santé, additifs, NaqiyScore.

Ouvrir Naqiy : ${B.site}

Après 7 jours, tu gardes l'accès gratuit à toutes les fonctionnalités essentielles. Tu décides, sans pression.

Bonne découverte.
Naqiy

---
Scanne. Comprends. Choisis.
naqiy.app`,
  };
}

// ---------------------------------------------------------------------------
// 2b. TRIAL REMINDER (J5 — il reste 2 jours)
// ---------------------------------------------------------------------------

export function trialReminderEmail(): {
  subject: string;
  html: string;
  text: string;
} {
  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="pad-mobile" style="padding: 44px 44px 0; text-align:center;">

          <!-- Urgency badge -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 24px;">
            <tr>
              <td style="padding:6px 18px; background-color:#FEF3C7; border:1px solid #FDE68A; border-radius:24px;">
                <span style="font-family:${B.fontBody}; font-size:12px; font-weight:600; color:#D97706; letter-spacing:0.8px; text-transform:uppercase;">
                  Plus que 2 jours
                </span>
              </td>
            </tr>
          </table>

          ${heading("Ton essai Naqiy+ se termine bient&ocirc;t.")}
          ${paragraph("Assalamu alaykum. Il te reste <strong style=\"color:" + B.textPrimary + "\">48 heures</strong> pour profiter de toutes les fonctionnalit&eacute;s premium. Apr&egrave;s, certaines seront r&eacute;serv&eacute;es aux abonn&eacute;s Naqiy+.", { center: true })}
        </td>
      </tr>
    </table>

    <!-- What you lose -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="pad-mobile" style="padding: 8px 44px 0;">
          ${divider()}
          <p style="margin:0 0 20px; font-family:${B.fontHeading}; font-size:16px; font-weight:700; color:${B.textPrimary}; line-height:1.4;">
            Ce que tu perds dans 48h
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${featureItem("scan", "Scans illimit&eacute;s", "Repass&eacute; &agrave; 5 scans/jour en mode gratuit.")}
            ${featureItem("madhab", "Analyse IA avanc&eacute;e", "Plus d&rsquo;extraction automatique d&rsquo;ingr&eacute;dients.")}
            ${featureItem("health", "Analyse sant&eacute; compl&egrave;te", "Additifs et NOVA r&eacute;serv&eacute;s &agrave; Naqiy+.", "leaf")}
          </table>
        </td>
      </tr>
    </table>

    <!-- Price anchor -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="pad-mobile" style="padding: 0 44px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${B.goldSubtle}; border-radius:16px; border:1px solid ${B.goldBorder};">
            <tr>
              <td style="padding: 24px; text-align:center;">
                <p style="margin:0 0 8px; font-family:${B.fontHeading}; font-size:28px; font-weight:800; color:${B.textPrimary}; line-height:1.2;">
                  2,99&euro;<span style="font-size:14px; font-weight:600; color:${B.textMuted};">/mois</span>
                </p>
                <p style="margin:0; font-family:${B.fontBody}; font-size:13px; color:${B.textSecondary}; line-height:1.5;">
                  Sans engagement. Annulable &agrave; tout moment.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding: 24px 44px 8px; text-align:center;">
          ${goldButton("Garder Naqiy+", B.site)}
        </td>
      </tr>
    </table>

    <!-- Reassurance -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="pad-mobile" style="padding: 12px 44px 44px; text-align:center;">
          ${paragraph("Tu ne veux pas t&rsquo;abonner ? Pas de souci. Tu garderas toujours acc&egrave;s aux fonctionnalit&eacute;s essentielles gratuitement.", { muted: true, small: true, center: true })}
        </td>
      </tr>
    </table>
  `;

  return {
    subject: "Plus que 2 jours de Naqiy+",
    html: baseLayout(content, {
      preheader: "Ton essai Naqiy+ se termine dans 48h. Garde l\u2019acc\u00e8s complet.",
    }),
    text: `Assalamu alaykum.

Ton essai Naqiy+ se termine bientôt. Il te reste 48 heures pour profiter de toutes les fonctionnalités premium.

CE QUE TU PERDS DANS 48H :
- Scans illimités → repassé à 5 scans/jour
- Analyse IA avancée → plus d'extraction automatique
- Analyse santé complète → additifs et NOVA réservés à Naqiy+

NAQIY+ : 2,99€/mois
Sans engagement. Annulable à tout moment.

Garder Naqiy+ : ${B.site}

Tu ne veux pas t'abonner ? Pas de souci. Tu garderas toujours accès aux fonctionnalités essentielles gratuitement.

---
Scanne. Comprends. Choisis.
naqiy.app`,
  };
}

// ---------------------------------------------------------------------------
// 2c. TRIAL EXPIRED (J7 — choix subscribe ou free)
// ---------------------------------------------------------------------------

export function trialExpiredEmail(): {
  subject: string;
  html: string;
  text: string;
} {
  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="pad-mobile" style="padding: 44px 44px 0; text-align:center;">
          ${heading("Ton essai Naqiy+ est termin&eacute;.")}
          ${paragraph("Assalamu alaykum. Tes 7 jours d&rsquo;essai sont &eacute;coul&eacute;s. Tu es d&eacute;sormais sur le plan gratuit &mdash; mais Naqiy+ t&rsquo;attend si tu veux retrouver l&rsquo;exp&eacute;rience compl&egrave;te.", { center: true })}
        </td>
      </tr>
    </table>

    <!-- Comparison: Free vs Naqiy+ -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="pad-mobile" style="padding: 8px 44px 0;">
          ${divider()}

          <!-- Two columns: Gratuit vs Naqiy+ -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <!-- GRATUIT -->
              <td width="48%" valign="top" style="padding-right:8px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${B.bgElevated}; border-radius:14px; border:1px solid ${B.divider};">
                  <tr>
                    <td style="padding:20px 16px;">
                      <p style="margin:0 0 16px; font-family:${B.fontHeading}; font-size:13px; font-weight:700; color:${B.textMuted}; letter-spacing:1px; text-transform:uppercase; text-align:center;">
                        Gratuit
                      </p>
                      <p style="margin:0 0 8px; font-family:${B.fontBody}; font-size:13px; color:${B.textSecondary}; line-height:22px;">
                        <span style="color:${B.textMuted};">&#10003;</span> 5 scans / jour
                      </p>
                      <p style="margin:0 0 8px; font-family:${B.fontBody}; font-size:13px; color:${B.textSecondary}; line-height:22px;">
                        <span style="color:${B.textMuted};">&#10003;</span> Verdict halal
                      </p>
                      <p style="margin:0 0 8px; font-family:${B.fontBody}; font-size:13px; color:${B.textSecondary}; line-height:22px;">
                        <span style="color:${B.textMuted};">&#10003;</span> NutriScore
                      </p>
                      <p style="margin:0 0 8px; font-family:${B.fontBody}; font-size:13px; color:${B.textMuted}; line-height:22px;">
                        &#10007; Analyse IA
                      </p>
                      <p style="margin:0; font-family:${B.fontBody}; font-size:13px; color:${B.textMuted}; line-height:22px;">
                        &#10007; Additifs &amp; NOVA
                      </p>
                    </td>
                  </tr>
                </table>
              </td>

              <!-- NAQIY+ -->
              <td width="48%" valign="top" style="padding-left:8px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${B.goldSubtle}; border-radius:14px; border:2px solid ${B.gold};">
                  <tr>
                    <td style="padding:20px 16px;">
                      <p style="margin:0 0 4px; font-family:${B.fontHeading}; font-size:13px; font-weight:700; color:${B.gold}; letter-spacing:1px; text-transform:uppercase; text-align:center;">
                        Naqiy+
                      </p>
                      <p style="margin:0 0 16px; font-family:${B.fontHeading}; font-size:11px; font-weight:600; color:${B.textMuted}; text-align:center;">
                        2,99&euro;/mois
                      </p>
                      <p style="margin:0 0 8px; font-family:${B.fontBody}; font-size:13px; color:${B.textPrimary}; line-height:22px;">
                        <span style="color:${B.leaf};">&#10003;</span> Scans illimit&eacute;s
                      </p>
                      <p style="margin:0 0 8px; font-family:${B.fontBody}; font-size:13px; color:${B.textPrimary}; line-height:22px;">
                        <span style="color:${B.leaf};">&#10003;</span> Verdict halal
                      </p>
                      <p style="margin:0 0 8px; font-family:${B.fontBody}; font-size:13px; color:${B.textPrimary}; line-height:22px;">
                        <span style="color:${B.leaf};">&#10003;</span> NutriScore
                      </p>
                      <p style="margin:0 0 8px; font-family:${B.fontBody}; font-size:13px; color:${B.textPrimary}; line-height:22px;">
                        <span style="color:${B.leaf};">&#10003;</span> Analyse IA
                      </p>
                      <p style="margin:0; font-family:${B.fontBody}; font-size:13px; color:${B.textPrimary}; line-height:22px;">
                        <span style="color:${B.leaf};">&#10003;</span> Additifs &amp; NOVA
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding: 28px 44px 8px; text-align:center;">
          ${goldButton("Passer &agrave; Naqiy+", B.site)}
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="pad-mobile" style="padding: 12px 44px 44px; text-align:center;">
          ${paragraph("Pas pr&ecirc;t&nbsp;? Aucun souci. Continue &agrave; utiliser Naqiy gratuitement &mdash; on sera toujours l&agrave;.", { muted: true, small: true, center: true })}
        </td>
      </tr>
    </table>
  `;

  return {
    subject: "Ton essai Naqiy+ est termin\u00e9",
    html: baseLayout(content, {
      preheader: "7 jours, c\u2019est pass\u00e9 vite. Garde Naqiy+ pour 2,99\u20ac/mois.",
    }),
    text: `Assalamu alaykum.

Ton essai Naqiy+ est terminé. Tes 7 jours d'essai sont écoulés. Tu es désormais sur le plan gratuit.

GRATUIT :
✓ 5 scans / jour
✓ Verdict halal
✓ NutriScore
✗ Analyse IA
✗ Additifs & NOVA

NAQIY+ (2,99€/mois) :
✓ Scans illimités
✓ Verdict halal
✓ NutriScore
✓ Analyse IA
✓ Additifs & NOVA

Passer à Naqiy+ : ${B.site}

Pas prêt ? Aucun souci. Continue à utiliser Naqiy gratuitement.

---
Scanne. Comprends. Choisis.
naqiy.app`,
  };
}

// ---------------------------------------------------------------------------
// 3. PASSWORD RESET
// ---------------------------------------------------------------------------

export function passwordResetEmail(resetCode: string): {
  subject: string;
  html: string;
  text: string;
} {
  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="pad-mobile" style="padding: 44px 44px 0; text-align:center;">
          ${heading("R&eacute;initialisation", { size: "md" })}
          ${paragraph("Assalamu alaykum. Tu as demand&eacute; la r&eacute;initialisation de ton mot de passe. Saisis le code ci-dessous dans l&rsquo;application.", { center: true })}
        </td>
      </tr>
    </table>

    <!-- Code -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="pad-mobile" style="padding: 8px 44px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="padding:28px; background-color:${B.bgElevated}; border-radius:16px; border:1px solid ${B.divider};">
                <span style="font-family:${B.fontMono}; font-size:40px; font-weight:700; letter-spacing:14px; color:${B.textPrimary}; line-height:1;">
                  ${resetCode}
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="pad-mobile" style="padding: 16px 44px 12px; text-align:center;">
          <p style="margin:0 0 8px; font-family:${B.fontBody}; font-size:13px; line-height:20px; color:${B.textSecondary};">
            Ce code expire dans <strong style="color:${B.textPrimary};">15&nbsp;minutes</strong>.
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="pad-mobile" style="padding: 0 44px 44px;">
          ${divider()}
          ${paragraph("Si tu n&rsquo;as pas fait cette demande, ignore cet email. Ton compte reste prot&eacute;g&eacute;.", { muted: true, small: true, center: true })}
        </td>
      </tr>
    </table>
  `;

  return {
    subject: "Ton code Naqiy : " + resetCode,
    html: baseLayout(content, {
      preheader: `Code : ${resetCode} \u2014 expire dans 15 minutes.`,
    }),
    text: `R\u00e9initialisation de ton mot de passe

Tu as demand\u00e9 la r\u00e9initialisation de ton mot de passe.

Ton code de v\u00e9rification : ${resetCode}

Ce code expire dans 15 minutes.

Si tu n'as pas fait cette demande, ignore cet email.

---
Scanne. Comprends. Choisis.
naqiy.app`,
  };
}

// ---------------------------------------------------------------------------
// 4. ACCOUNT DELETION
// ---------------------------------------------------------------------------

export function accountDeletionEmail(): {
  subject: string;
  html: string;
  text: string;
} {
  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="pad-mobile" style="padding: 44px 44px 0; text-align:center;">
          ${heading("Compte supprim&eacute;", { size: "md" })}
          ${paragraph("Assalamu alaykum. Ton compte Naqiy et toutes tes donn&eacute;es personnelles ont &eacute;t&eacute; d&eacute;finitivement supprim&eacute;s, conform&eacute;ment au RGPD.", { center: true })}
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="pad-mobile" style="padding: 8px 44px 0;">
          ${divider()}
          <p style="margin:0 0 16px; font-family:${B.fontHeading}; font-size:14px; font-weight:700; color:${B.textPrimary}; line-height:1.4;">
            Donn&eacute;es supprim&eacute;es
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${deletionItem("Historique de scans et r&eacute;sultats d&rsquo;analyse")}
            ${deletionItem("Favoris et dossiers de produits")}
            ${deletionItem("Pr&eacute;f&eacute;rences &mdash; madhab, allerg&egrave;nes, profil sant&eacute;")}
            ${deletionItem("Abonnement Naqiy+ annul&eacute; automatiquement")}
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="pad-mobile" style="padding: 8px 44px 0;">
          ${divider()}
          ${paragraph("Si tu changes d&rsquo;avis, tu peux recr&eacute;er un compte depuis l&rsquo;application.", { center: true })}
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="pad-mobile" style="padding: 16px 44px 44px; text-align:center;">
          ${divider()}
          ${paragraph("Merci d&rsquo;avoir utilis&eacute; Naqiy.", { muted: true, small: true, center: true })}
          <p style="margin:0; font-family:${B.fontHeading}; font-size:14px; font-weight:700; color:${B.gold};">
            Naqiy
          </p>
        </td>
      </tr>
    </table>
  `;

  return {
    subject: "Ton compte Naqiy a \u00e9t\u00e9 supprim\u00e9",
    html: baseLayout(content, {
      preheader: "Ton compte et tes donn\u00e9es ont \u00e9t\u00e9 d\u00e9finitivement supprim\u00e9s.",
    }),
    text: `Compte supprim\u00e9

Ton compte Naqiy et toutes tes donn\u00e9es personnelles ont \u00e9t\u00e9 d\u00e9finitivement supprim\u00e9s, conform\u00e9ment au RGPD.

Donn\u00e9es supprim\u00e9es :
- Historique de scans et r\u00e9sultats d'analyse
- Favoris et dossiers de produits
- Pr\u00e9f\u00e9rences \u2014 madhab, allerg\u00e8nes, profil sant\u00e9
- Abonnement Naqiy+ annul\u00e9 automatiquement

Si tu changes d'avis, tu peux recr\u00e9er un compte depuis l'application.

Merci d'avoir utilis\u00e9 Naqiy.
L'\u00e9quipe Naqiy

---
Scanne. Comprends. Choisis.
naqiy.app`,
  };
}

// ---------------------------------------------------------------------------
// 5. LAUNCH NOTIFICATION
// ---------------------------------------------------------------------------

export function launchNotificationEmail(): {
  subject: string;
  html: string;
  text: string;
} {
  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="pad-mobile" style="padding: 44px 44px 0; text-align:center;">

          <!-- Launch badge -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 24px;">
            <tr>
              <td style="padding:6px 18px; background-color:${B.goldSubtle}; border:1px solid ${B.goldBorder}; border-radius:24px;">
                <span style="font-family:${B.fontBody}; font-size:12px; font-weight:600; color:${B.gold}; letter-spacing:0.8px; text-transform:uppercase;">
                  C&rsquo;est le jour J
                </span>
              </td>
            </tr>
          </table>

          ${heading("Naqiy est disponible.")}
          ${paragraph("Assalamu alaykum. Tu faisais partie des premiers &agrave; y croire. Aujourd&rsquo;hui, Naqiy est disponible sur l&rsquo;App Store et Google Play &mdash; et tes <strong style=\"color:" + B.textPrimary + "\">7&nbsp;jours de Naqiy+ offerts</strong> t&rsquo;attendent.", { center: true })}
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding: 12px 44px 8px; text-align:center;">
          ${goldButton("T&eacute;l&eacute;charger l&rsquo;app", B.site)}
        </td>
      </tr>
    </table>

    <!-- Score Preview -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding: 0 0;">${divider()}</td></tr>
    </table>
    ${scorePreview()}

    <!-- Features -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="pad-mobile" style="padding: 8px 44px 0;">
          ${divider()}
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${featureItem("scan", "Scan instantan&eacute;", "Pointe, scanne, sois fix&eacute;.")}
            ${featureItem("shield", "NaqiyScore", "Ton indice de confiance halal, de 0 &agrave; 100.")}
            ${featureItem("health", "Analyse sant&eacute;", "NutriScore, additifs, NOVA &mdash; la sant&eacute; au-del&agrave; du halal.", "leaf")}
            ${featureItem("star", "100% gratuit", "Naqiy+ en option pour les fonctionnalit&eacute;s avanc&eacute;es.")}
          </table>
        </td>
      </tr>
    </table>

    <!-- Instagram -->
    ${instagramSection()}

    <!-- Closing -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="pad-mobile" style="padding: 20px 44px 44px; text-align:center;">
          ${paragraph("Merci d&rsquo;avoir cru en nous depuis le d&eacute;but.", { muted: true, small: true, center: true })}
          <p style="margin:0; font-family:${B.fontHeading}; font-size:14px; font-weight:700; color:${B.gold};">
            Naqiy
          </p>
        </td>
      </tr>
    </table>
  `;

  return {
    subject: "Naqiy est disponible \u2014 t\u00e9l\u00e9charge l\u2019app",
    html: baseLayout(content, {
      preheader: "L\u2019app Naqiy est enfin disponible sur iOS et Android.",
    }),
    text: `Assalamu alaykum. Naqiy est disponible.

Tu faisais partie des premiers à y croire. Aujourd'hui, Naqiy est disponible sur l'App Store et Google Play — et tes 7 jours de Naqiy+ offerts t'attendent.

T\u00e9l\u00e9charge l'app : ${B.site}

NaqiyScore Halal : 95/100 — Très fiable
NutriScore Santé : A — Excellent

- Scan instantan\u00e9 \u2014 Pointe, scanne, sois fix\u00e9.
- NaqiyScore \u2014 Ton indice de confiance halal, de 0 \u00e0 100.
- Analyse sant\u00e9 \u2014 NutriScore, additifs, NOVA.
- 100% gratuit \u2014 Naqiy+ en option pour les fonctionnalit\u00e9s avanc\u00e9es.

Merci d'avoir cru en nous depuis le d\u00e9but.
L'\u00e9quipe Naqiy

---
Scanne. Comprends. Choisis.
naqiy.app`,
  };
}
