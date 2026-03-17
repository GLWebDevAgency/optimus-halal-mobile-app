import { Img, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

interface NaqiyLogoProps {
  size?: number;
  enterDelay?: number;
}

export const NaqiyLogo: React.FC<NaqiyLogoProps> = ({
  size = 280,
  enterDelay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - enterDelay,
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.8 },
  });

  const opacity = interpolate(frame - enterDelay, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      <Img
        src={staticFile("logo_naqiy.png")}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
  );
};
