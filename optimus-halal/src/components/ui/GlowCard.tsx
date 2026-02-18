import React from "react";
import { View, type ViewStyle, type ViewProps } from "react-native";
import { brand } from "@/theme/colors";
import { radius } from "@/theme/spacing";
import { useTheme } from "@/hooks/useTheme";

type GlowIntensity = "subtle" | "medium" | "strong";

interface GlowCardProps extends ViewProps {
  glowColor?: string;
  glowIntensity?: GlowIntensity;
  children: React.ReactNode;
  style?: ViewStyle;
}

const GLOW_CONFIG: Record<GlowIntensity, { opacity: number; radius: number; elevation: number }> = {
  subtle: { opacity: 0.08, radius: 12, elevation: 3 },
  medium: { opacity: 0.15, radius: 20, elevation: 6 },
  strong: { opacity: 0.25, radius: 28, elevation: 10 },
};

export const GlowCard: React.FC<GlowCardProps> = ({
  glowColor = brand.primary,
  glowIntensity = "subtle",
  children,
  style,
  ...props
}) => {
  const { colors } = useTheme();
  const glow = GLOW_CONFIG[glowIntensity];

  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          shadowColor: glowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: glow.opacity,
          shadowRadius: glow.radius,
          elevation: glow.elevation,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

export default GlowCard;
