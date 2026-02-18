import React from "react";
import { View, type ViewStyle } from "react-native";
import Svg, { Path, Defs, Pattern, Rect } from "react-native-svg";
import { brand } from "@/theme/colors";

type PatternVariant = "tessellation" | "arabesque" | "khatam";

interface IslamicPatternProps {
  variant?: PatternVariant;
  color?: string;
  opacity?: number;
  style?: ViewStyle;
}

const PATTERN_PATHS: Record<PatternVariant, { d: string; viewBox: string; size: number }> = {
  tessellation: {
    d: "M25,0 L50,14.4 L50,43.3 L25,57.7 L0,43.3 L0,14.4 Z",
    viewBox: "0 0 50 57.7",
    size: 50,
  },
  arabesque: {
    d: "M0,20 Q10,0 20,20 Q30,40 40,20 Q50,0 60,20",
    viewBox: "0 0 60 40",
    size: 60,
  },
  khatam: {
    d: "M25,0 L31.9,18.1 L50,25 L31.9,31.9 L25,50 L18.1,31.9 L0,25 L18.1,18.1 Z",
    viewBox: "0 0 50 50",
    size: 50,
  },
};

export const IslamicPattern: React.FC<IslamicPatternProps> = ({
  variant = "tessellation",
  color = brand.primary,
  opacity = 0.03,
  style,
}) => {
  const pattern = PATTERN_PATHS[variant];
  return (
    <View style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }, style]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id={`islamic-${variant}`} x="0" y="0" width={pattern.size} height={pattern.size} patternUnits="userSpaceOnUse">
            <Path d={pattern.d} fill={color} fillOpacity={opacity} stroke={color} strokeOpacity={opacity * 0.5} strokeWidth={0.5} />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#islamic-${variant})`} />
      </Svg>
    </View>
  );
};

export default IslamicPattern;
