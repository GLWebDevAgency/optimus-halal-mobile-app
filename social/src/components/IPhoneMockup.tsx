import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

/**
 * IPhoneMockup — CSS-only iPhone 15 Pro device frame.
 *
 * Renders a realistic phone bezel with Dynamic Island, rounded corners,
 * and subtle highlights. Children render as the screen content.
 * Light theme: silver titanium frame. Dark theme: dark chrome.
 */

interface IPhoneMockupProps {
  children: React.ReactNode;
  width?: number;
  enterDelay?: number;
  dark?: boolean;
}

const ASPECT = 19.5 / 9; // iPhone 15 Pro aspect ratio
const BEZEL = 14;
const OUTER_RADIUS = 48;
const INNER_RADIUS = 36;
const ISLAND_W = 120;
const ISLAND_H = 34;
const ISLAND_RADIUS = 17;
const ISLAND_TOP = 14;

export const IPhoneMockup: React.FC<IPhoneMockupProps> = ({
  children,
  width = 480,
  enterDelay = 0,
  dark = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const height = Math.round(width * ASPECT);
  const screenW = width - BEZEL * 2;
  const screenH = height - BEZEL * 2;

  // Slide-up animation
  const sc = spring({
    frame: frame - enterDelay,
    fps,
    config: { damping: 20, stiffness: 150, mass: 0.5 },
  });
  const ty = interpolate(sc, [0, 1], [80, 0]);
  const opacity = interpolate(frame - enterDelay, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Frame colors
  const frameColor = dark ? "#1C1C1E" : "#E8E8ED";
  const frameBorder = dark
    ? "1px solid rgba(255,255,255,0.08)"
    : "1px solid rgba(0,0,0,0.06)";
  const frameShadow = dark
    ? "0 20px 60px rgba(0,0,0,0.6)"
    : "0 20px 60px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.08)";

  return (
    <div
      style={{
        width,
        height,
        borderRadius: OUTER_RADIUS,
        backgroundColor: frameColor,
        border: frameBorder,
        boxShadow: frameShadow,
        position: "relative",
        overflow: "hidden",
        transform: `translateY(${ty}px)`,
        opacity,
      }}
    >
      {/* Screen area */}
      <div
        style={{
          position: "absolute",
          top: BEZEL,
          left: BEZEL,
          width: screenW,
          height: screenH,
          borderRadius: INNER_RADIUS,
          overflow: "hidden",
          backgroundColor: dark ? "#000000" : "#FFFFFF",
        }}
      >
        {children}
      </div>

      {/* Dynamic Island */}
      <div
        style={{
          position: "absolute",
          top: BEZEL + ISLAND_TOP,
          left: (width - ISLAND_W) / 2,
          width: ISLAND_W,
          height: ISLAND_H,
          borderRadius: ISLAND_RADIUS,
          backgroundColor: "#000000",
          zIndex: 10,
        }}
      />
    </div>
  );
};
