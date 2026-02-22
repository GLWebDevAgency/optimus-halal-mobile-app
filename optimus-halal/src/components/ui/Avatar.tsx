/**
 * Avatar Component
 * 
 * Composant avatar pour photos de profil et images
 */

import React from "react";
import { View, ViewProps, Text } from "react-native";
import { Image } from "expo-image";
import { brand } from "@/theme/colors";
import { useTheme } from "@/hooks/useTheme";

export interface AvatarProps extends ViewProps {
  source?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  fallback?: string;
  borderColor?: "primary" | "gold" | "white" | "none";
  showBadge?: boolean;
  badgeColor?: string;
}

const sizeConfig = {
  xs: { container: 24, text: 10, border: 1, badge: 6 },
  sm: { container: 32, text: 12, border: 2, badge: 8 },
  md: { container: 44, text: 14, border: 2, badge: 10 },
  lg: { container: 48, text: 16, border: 2, badge: 12 },
  xl: { container: 64, text: 20, border: 3, badge: 14 },
  "2xl": { container: 96, text: 28, border: 4, badge: 18 },
};

const borderColors = {
  primary: "border-primary-500",
  gold: "border-gold-500",
  white: "border-white dark:border-slate-800",
  none: "border-transparent",
};

export const Avatar: React.FC<AvatarProps> = ({
  source,
  size = "md",
  fallback = "?",
  borderColor = "none",
  showBadge = false,
  badgeColor = brand.primary,
  className = "",
  ...props
}) => {
  const { isDark, colors } = useTheme();
  const config = sizeConfig[size];
  const initials = fallback
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <View
      className={`relative ${className}`}
      style={{
        width: config.container,
        height: config.container,
      }}
      {...props}
    >
      {source ? (
        <Image
          source={{ uri: source }}
          style={{
            width: config.container,
            height: config.container,
            borderRadius: config.container / 2,
            borderWidth: config.border,
          }}
          className={`${borderColors[borderColor]}`}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View
          className={`
            items-center justify-center
            ${borderColors[borderColor]}
          `}
          style={{
            width: config.container,
            height: config.container,
            borderRadius: config.container / 2,
            borderWidth: config.border,
            backgroundColor: isDark ? "rgba(212, 175, 55, 0.1)" : colors.backgroundSecondary,
          }}
        >
          <Text
            className="font-bold"
            style={{ fontSize: config.text, color: isDark ? "rgba(212, 175, 55, 0.7)" : colors.textSecondary }}
          >
            {initials}
          </Text>
        </View>
      )}

      {showBadge && (
        <View
          className="absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-slate-800"
          style={{
            width: config.badge,
            height: config.badge,
            backgroundColor: badgeColor,
          }}
        />
      )}
    </View>
  );
};

/**
 * Avatar Group Component
 */
export interface AvatarGroupProps extends ViewProps {
  avatars: { source?: string; fallback?: string }[];
  max?: number;
  size?: AvatarProps["size"];
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 4,
  size = "sm",
  className = "",
  ...props
}) => {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;
  const config = sizeConfig[size];

  return (
    <View className={`flex-row ${className}`} {...props}>
      {visibleAvatars.map((avatar, index) => (
        <View
          key={index}
          style={{ marginStart: index > 0 ? -config.container / 3 : 0 }}
        >
          <Avatar
            source={avatar.source}
            fallback={avatar.fallback}
            size={size}
            borderColor="white"
          />
        </View>
      ))}
      {remainingCount > 0 && (
        <View
          className="items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full border-2 border-white dark:border-slate-800"
          style={{
            width: config.container,
            height: config.container,
            marginStart: -config.container / 3,
          }}
        >
          <Text
            className="text-slate-500 dark:text-slate-300 font-bold"
            style={{ fontSize: config.text * 0.8 }}
          >
            +{remainingCount > 99 ? "99" : remainingCount}
          </Text>
        </View>
      )}
    </View>
  );
};

export default Avatar;
