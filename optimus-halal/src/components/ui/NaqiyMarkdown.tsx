/**
 * NaqiyMarkdown — Premium Markdown renderer with Naqiy design system.
 *
 * Apple News / Medium-quality typography for editorial content.
 * Uses react-native-markdown-display with custom styles matching
 * Naqiy design tokens (Nunito headings, Nunito Sans body).
 *
 * Features:
 * - Nunito headings (h1-h4), Nunito Sans body (body, caption)
 * - Themed colors (light/dark adaptive)
 * - Clickable links (opens in-app browser)
 * - Blockquote with accent bar (like Medium pull-quotes)
 * - Styled lists, code blocks, horizontal rules
 * - Image support with rounded corners
 *
 * @module components/ui/NaqiyMarkdown
 */

import React, { useMemo } from "react";
import { Linking, type TextStyle, type ViewStyle } from "react-native";
import Markdown, { type MarkdownIt } from "react-native-markdown-display";
import { useTheme } from "@/hooks/useTheme";
import {
  headingFontFamily,
  bodyFontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
} from "@/theme/typography";
import { brand, gold } from "@/theme/colors";
import { spacing, radius } from "@/theme/spacing";

interface NaqiyMarkdownProps {
  children: string;
  /** Override accent color (default: brand.primary in light, gold[500] in dark) */
  accentColor?: string;
}

export const NaqiyMarkdown = React.memo(function NaqiyMarkdown({
  children,
  accentColor,
}: NaqiyMarkdownProps) {
  const { isDark, colors } = useTheme();

  const accent = accentColor ?? (isDark ? gold[500] : brand.primary);

  const styles = useMemo(
    () => buildStyles(isDark, colors, accent),
    [isDark, colors, accent],
  );

  const handleLinkPress = (url: string) => {
    Linking.openURL(url);
    return false; // prevent default
  };

  return (
    <Markdown
      style={styles}
      onLinkPress={handleLinkPress}
    >
      {children}
    </Markdown>
  );
});

// ── Style builder ──────────────────────────────────────

function buildStyles(
  isDark: boolean,
  colors: { textPrimary: string; textSecondary: string; textMuted: string; border: string; background: string },
  accent: string,
) {
  return {
    // ── Body text ──
    body: {
      fontFamily: bodyFontFamily.regular,
      fontSize: fontSize.body,
      fontWeight: fontWeight.regular,
      lineHeight: 28, // generous for readability (Apple News-style)
      color: colors.textPrimary,
      letterSpacing: 0.1,
    } as TextStyle,

    paragraph: {
      marginBottom: 16,
      marginTop: 0,
    } as ViewStyle,

    // ── Headings (Nunito) ──
    heading1: {
      fontFamily: headingFontFamily.bold,
      fontSize: fontSize.h1,
      fontWeight: fontWeight.bold,
      lineHeight: lineHeight.h1,
      letterSpacing: letterSpacing.tight,
      color: colors.textPrimary,
      marginTop: 32,
      marginBottom: 12,
    } as TextStyle,

    heading2: {
      fontFamily: headingFontFamily.bold,
      fontSize: fontSize.h2,
      fontWeight: fontWeight.bold,
      lineHeight: lineHeight.h2,
      color: colors.textPrimary,
      marginTop: 28,
      marginBottom: 10,
    } as TextStyle,

    heading3: {
      fontFamily: headingFontFamily.semiBold,
      fontSize: fontSize.h3,
      fontWeight: fontWeight.semiBold,
      lineHeight: lineHeight.h3,
      color: colors.textPrimary,
      marginTop: 24,
      marginBottom: 8,
    } as TextStyle,

    heading4: {
      fontFamily: headingFontFamily.semiBold,
      fontSize: fontSize.h4,
      fontWeight: fontWeight.semiBold,
      lineHeight: lineHeight.h4,
      color: colors.textPrimary,
      marginTop: 20,
      marginBottom: 6,
    } as TextStyle,

    // ── Strong / Emphasis ──
    strong: {
      fontFamily: bodyFontFamily.bold,
      fontWeight: fontWeight.bold,
      color: colors.textPrimary,
    } as TextStyle,

    em: {
      fontStyle: "italic",
      color: colors.textSecondary,
    } as TextStyle,

    // ── Links ──
    link: {
      color: accent,
      fontWeight: fontWeight.semiBold,
      textDecorationLine: "none",
    } as TextStyle,

    // ── Blockquote (Medium-style pull quote) ──
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: accent,
      paddingLeft: 16,
      paddingVertical: 4,
      marginVertical: 16,
      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
      borderRadius: 4,
    } as ViewStyle,

    // ── Lists ──
    bullet_list: {
      marginBottom: 12,
    } as ViewStyle,

    ordered_list: {
      marginBottom: 12,
    } as ViewStyle,

    list_item: {
      marginBottom: 6,
      flexDirection: "row",
    } as ViewStyle,

    bullet_list_icon: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: accent,
      marginTop: 9,
      marginRight: 10,
    } as ViewStyle,

    ordered_list_icon: {
      fontFamily: bodyFontFamily.bold,
      fontSize: fontSize.bodySmall,
      fontWeight: fontWeight.bold,
      color: accent,
      marginRight: 8,
    } as TextStyle,

    // ── Code ──
    code_inline: {
      fontFamily: "Menlo",
      fontSize: fontSize.bodySmall - 1,
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
      color: colors.textPrimary,
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 4,
    } as TextStyle,

    code_block: {
      fontFamily: "Menlo",
      fontSize: fontSize.bodySmall - 1,
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
      color: colors.textPrimary,
      padding: 14,
      borderRadius: 12,
      marginVertical: 12,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
    } as TextStyle,

    fence: {
      fontFamily: "Menlo",
      fontSize: fontSize.bodySmall - 1,
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
      color: colors.textPrimary,
      padding: 14,
      borderRadius: 12,
      marginVertical: 12,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
    } as TextStyle,

    // ── Horizontal rule ──
    hr: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 24,
    } as ViewStyle,

    // ── Images ──
    image: {
      borderRadius: 12,
      marginVertical: 12,
    } as ViewStyle,

    // ── Table ──
    table: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      marginVertical: 12,
    } as ViewStyle,

    thead: {
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
    } as ViewStyle,

    th: {
      fontFamily: bodyFontFamily.semiBold,
      fontWeight: fontWeight.semiBold,
      padding: 8,
      color: colors.textPrimary,
    } as TextStyle,

    td: {
      fontFamily: bodyFontFamily.regular,
      padding: 8,
      color: colors.textSecondary,
      borderTopWidth: 1,
      borderColor: colors.border,
    } as TextStyle,
  };
}

export default NaqiyMarkdown;
