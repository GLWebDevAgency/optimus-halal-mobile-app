import React from "react";
import { View, Text, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "@/hooks/useTheme";
import { brand } from "@/theme/colors";

type SeparatorVariant = "line" | "arabesque" | "dots";

interface SectionSeparatorProps {
  label?: string;
  variant?: SeparatorVariant;
  style?: ViewStyle;
}

export const SectionSeparator: React.FC<SectionSeparatorProps> = ({
  label,
  variant = "line",
  style,
}) => {
  const { colors } = useTheme();

  if (variant === "arabesque") {
    return (
      <View style={[{ flexDirection: "row", alignItems: "center", marginVertical: 16, gap: 12 }, style]}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        <Svg width={24} height={12} viewBox="0 0 24 12">
          <Path d="M0,6 Q6,0 12,6 Q18,12 24,6" stroke={brand.primary} strokeWidth={1.5} fill="none" opacity={0.4} />
        </Svg>
        {label && <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "600" }}>{label}</Text>}
        <Svg width={24} height={12} viewBox="0 0 24 12">
          <Path d="M0,6 Q6,0 12,6 Q18,12 24,6" stroke={brand.primary} strokeWidth={1.5} fill="none" opacity={0.4} />
        </Svg>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>
    );
  }

  if (variant === "dots") {
    return (
      <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginVertical: 16, gap: 6 }, style]}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
        ))}
      </View>
    );
  }

  return (
    <View style={[{ flexDirection: "row", alignItems: "center", marginVertical: 16, gap: 12 }, style]}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      {label && <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "600" }}>{label}</Text>}
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
    </View>
  );
};

export default SectionSeparator;
