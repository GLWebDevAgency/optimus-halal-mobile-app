import React from "react";
import { View, Text } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";
import { halalStatus as statusColors } from "@/theme/colors";
import { useTranslation } from "@/hooks";

type HalalStatus = "halal" | "haram" | "doubtful" | "unknown";
type PillSize = "sm" | "md" | "lg";

interface StatusPillProps {
  status: HalalStatus;
  size?: PillSize;
  animated?: boolean;
}

const SIZE_CONFIG: Record<PillSize, { h: number; iconSize: number; fontSize: number; px: number }> = {
  sm: { h: 24, iconSize: 14, fontSize: 11, px: 8 },
  md: { h: 32, iconSize: 18, fontSize: 13, px: 12 },
  lg: { h: 40, iconSize: 22, fontSize: 15, px: 16 },
};

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  size = "md",
  animated = true,
}) => {
  const { t } = useTranslation();

  const statusConfig: Record<HalalStatus, { icon: keyof typeof MaterialIcons.glyphMap; label: string; bg: string; color: string }> = {
    halal: { icon: "verified", label: t.scanResult.halal, bg: statusColors.halal.bg, color: statusColors.halal.base },
    haram: { icon: "dangerous", label: t.scanResult.haram, bg: statusColors.haram.bg, color: statusColors.haram.base },
    doubtful: { icon: "help-outline", label: t.scanResult.doubtful, bg: statusColors.doubtful.bg, color: statusColors.doubtful.base },
    unknown: { icon: "help", label: t.scanResult.unknown, bg: statusColors.unknown.bg, color: statusColors.unknown.base },
  };

  const config = statusConfig[status];
  const sizeConfig = SIZE_CONFIG[size];

  const pill = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: config.bg,
        borderRadius: sizeConfig.h / 2,
        height: sizeConfig.h,
        paddingHorizontal: sizeConfig.px,
        gap: 4,
      }}
      accessibilityRole="text"
      accessibilityLabel={`Statut: ${config.label}`}
    >
      <MaterialIcons name={config.icon} size={sizeConfig.iconSize} color={config.color} />
      <Text style={{ color: config.color, fontSize: sizeConfig.fontSize, fontWeight: "700" }}>{config.label}</Text>
    </View>
  );

  if (!animated) return pill;
  return (
    <Animated.View entering={ZoomIn.duration(300)}>
      {pill}
    </Animated.View>
  );
};

export default StatusPill;
