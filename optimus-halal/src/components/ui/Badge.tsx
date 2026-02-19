/**
 * Badge Component
 * 
 * Composant badge pour statuts, certifications, tags
 */

import React from "react";
import { View, Text, ViewProps } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "@/hooks";
import { semantic, neutral } from "@/theme/colors";

export interface BadgeProps extends ViewProps {
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "gold";
  size?: "sm" | "md" | "lg";
  icon?: keyof typeof MaterialIcons.glyphMap;
  children: React.ReactNode;
}

const variantStyles = {
  success: {
    container: "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800",
    text: "text-emerald-700 dark:text-emerald-300",
    iconColor: semantic.success.dark,
  },
  warning: {
    container: "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-100 dark:border-yellow-800",
    text: "text-yellow-700 dark:text-yellow-300",
    iconColor: semantic.warning.dark,
  },
  danger: {
    container: "bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800",
    text: "text-red-700 dark:text-red-300",
    iconColor: "#dc2626",
  },
  info: {
    container: "bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-300",
    iconColor: "#2563eb",
  },
  neutral: {
    container: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
    text: "text-slate-600 dark:text-slate-300",
    iconColor: neutral[600],
  },
  gold: {
    container: "bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-300",
    iconColor: semantic.warning.dark,
  },
};

const sizeStyles = {
  sm: {
    container: "px-2 py-0.5 rounded",
    text: "text-[10px] font-bold",
    iconSize: 12,
  },
  md: {
    container: "px-3 py-1 rounded-lg",
    text: "text-xs font-semibold",
    iconSize: 14,
  },
  lg: {
    container: "px-4 py-1.5 rounded-xl",
    text: "text-sm font-semibold",
    iconSize: 16,
  },
};

export const Badge: React.FC<BadgeProps> = ({
  variant = "neutral",
  size = "md",
  icon,
  className = "",
  children,
  ...props
}) => {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <View
      className={`
        flex-row items-center gap-1
        border
        ${variantStyle.container}
        ${sizeStyle.container}
        ${className}
      `}
      {...props}
    >
      {icon && (
        <MaterialIcons
          name={icon}
          size={sizeStyle.iconSize}
          color={variantStyle.iconColor}
        />
      )}
      <Text
        className={`
          uppercase tracking-wider
          ${variantStyle.text}
          ${sizeStyle.text}
        `}
      >
        {children}
      </Text>
    </View>
  );
};

/**
 * Certification Badge - Special variant for halal certifications
 */
export interface CertificationBadgeProps {
  status: "halal" | "doubtful" | "haram" | "unknown";
  authority?: string;
  size?: "sm" | "md" | "lg";
}

const certificationConfig = {
  halal: {
    variant: "success" as const,
    icon: "verified" as const,
    labelKey: "certifiedHalal" as const,
  },
  doubtful: {
    variant: "warning" as const,
    icon: "help" as const,
    labelKey: "doubtfulCertification" as const,
  },
  haram: {
    variant: "danger" as const,
    icon: "cancel" as const,
    labelKey: "notHalal" as const,
  },
  unknown: {
    variant: "neutral" as const,
    icon: "help-outline" as const,
    labelKey: "unknown" as const,
  },
};

export const CertificationBadge: React.FC<CertificationBadgeProps> = ({
  status,
  authority,
  size = "md",
}) => {
  const { t } = useTranslation();
  const config = certificationConfig[status];

  return (
    <Badge variant={config.variant} size={size} icon={config.icon}>
      {authority || t.badge[config.labelKey]}
    </Badge>
  );
};

export default Badge;
