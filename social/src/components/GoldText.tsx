import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { goldTextStyle, fonts } from "../theme";

interface GoldTextProps {
  children: string;
  fontSize?: number;
  enterDelay?: number;
  fontWeight?: number;
  letterSpacing?: number;
  style?: React.CSSProperties;
}

export const GoldText: React.FC<GoldTextProps> = ({
  children,
  fontSize = 64,
  enterDelay = 0,
  fontWeight = 800,
  letterSpacing = 2,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - enterDelay,
    fps,
    config: { damping: 18, stiffness: 100 },
  });

  const opacity = interpolate(frame - enterDelay, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(progress, [0, 1], [30, 0]);

  return (
    <div
      style={{
        ...goldTextStyle,
        fontFamily: fonts.heading,
        fontSize,
        fontWeight,
        letterSpacing,
        textAlign: "center",
        transform: `translateY(${translateY}px)`,
        opacity,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
