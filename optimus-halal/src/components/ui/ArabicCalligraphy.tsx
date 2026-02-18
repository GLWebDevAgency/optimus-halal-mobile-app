import React from "react";
import { Text, Platform, type TextStyle } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { brand } from "@/theme/colors";

type CalligraphyText = "bismillah" | "halalTayyib" | "salam" | "ramadan";

const CALLIGRAPHY_MAP: Record<CalligraphyText, string> = {
  bismillah: "\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u0651\u064E\u0640\u0647\u0650",
  halalTayyib: "\u062D\u064E\u0644\u064E\u0627\u0644\u064C \u0637\u064E\u064A\u0651\u0650\u0628\u064C",
  salam: "\u0671\u0644\u0633\u0651\u064E\u0644\u064E\u0627\u0645\u064F \u0639\u064E\u0644\u064E\u064A\u0652\u0643\u064F\u0645\u0652",
  ramadan: "\u0631\u064E\u0645\u064E\u0636\u064E\u0627\u0646\u064E \u0643\u064E\u0631\u0650\u064A\u0645\u064C",
};

interface ArabicCalligraphyProps {
  text: CalligraphyText;
  color?: string;
  size?: number;
  opacity?: number;
  animated?: boolean;
  style?: TextStyle;
}

export const ArabicCalligraphy: React.FC<ArabicCalligraphyProps> = ({
  text,
  color = brand.primary,
  size = 28,
  opacity = 1,
  animated = true,
  style,
}) => {
  const content = (
    <Text
      style={[
        {
          fontFamily: Platform.OS === "ios" ? "GeezaPro-Bold" : "sans-serif",
          fontSize: size,
          color,
          opacity,
          textAlign: "center",
          writingDirection: "rtl",
        },
        style,
      ]}
      accessible={false}
    >
      {CALLIGRAPHY_MAP[text]}
    </Text>
  );

  if (!animated) return content;
  return (
    <Animated.View entering={FadeIn.duration(800).delay(400)}>
      {content}
    </Animated.View>
  );
};

export default ArabicCalligraphy;
