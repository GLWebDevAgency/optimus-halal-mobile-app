import { useCurrentFrame, interpolate } from "remotion";
import { colors } from "../theme";

interface GlowRingProps {
  size?: number;
  enterDelay?: number;
}

export const GlowRing: React.FC<GlowRingProps> = ({
  size = 360,
  enterDelay = 0,
}) => {
  const frame = useCurrentFrame();

  const pulsePhase = interpolate(
    (frame - enterDelay) % 60,
    [0, 30, 60],
    [0.08, 0.2, 0.08],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const scale = interpolate(
    (frame - enterDelay) % 60,
    [0, 30, 60],
    [0.95, 1.08, 0.95],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const opacity = interpolate(frame - enterDelay, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${colors.gold}${Math.round(pulsePhase * 255)
          .toString(16)
          .padStart(2, "0")} 0%, transparent 70%)`,
        transform: `scale(${scale})`,
        opacity,
        pointerEvents: "none",
      }}
    />
  );
};
