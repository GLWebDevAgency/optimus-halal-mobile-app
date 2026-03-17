import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { noise3D } from "@remotion/noise";

/**
 * PremiumBackground — Remotion port of the app's 7-layer brushed metal system.
 *
 * Faithfully reproduces the PremiumBackground.tsx from the mobile app using
 * pure CSS (no expo-linear-gradient). Adds subtle animation (noise-driven
 * dust drift, pulsing vignette) that the static app version can't do.
 *
 * Architecture (matching app exactly):
 *   L0: Base — solid warm tone (#0C0C0C dark / #f3f1ed light)
 *   L1: Brushed metal — horizontal gradient bands
 *   L2: Metal reflection — diagonal highlight band
 *   L3: Gold dust primary — 5 asymmetric radial orbs
 *   L4: Secondary dust — smaller accent particles
 *   L5: Brush grain — fine horizontal texture
 *   L6: Vignette — soft edge darkening
 *
 * Usage:
 *   <PremiumBackground mode="light" />
 *   <PremiumBackground mode="dark" />
 */

const W = 1080;
const H = 1920;

export interface PremiumBackgroundProps {
  mode: "light" | "dark";
  intensity?: number;
}

export const PremiumBackground: React.FC<PremiumBackgroundProps> = ({
  mode,
  intensity = 1,
}) => {
  const frame = useCurrentFrame();
  const dark = mode === "dark";
  const i = intensity;

  return (
    <AbsoluteFill>
      {/* ── L0: Base ── */}
      <AbsoluteFill
        style={{ backgroundColor: dark ? "#0C0C0C" : "#f3f1ed" }}
      />

      {/* ── L1: Brushed metal bands ── */}
      <AbsoluteFill
        style={{
          background: dark
            ? `linear-gradient(180deg,
                #0e0e0e 0%, #141414 15%, #0b0b0b 30%,
                #111111 45%, #0d0d0d 62%, #131313 78%, #0a0a0a 100%)`
            : `linear-gradient(180deg,
                #f4f2ee 0%, #f8f6f2 15%, #f0eee9 30%,
                #f6f4f0 45%, #eeedea 62%, #f5f3ef 78%, #f1efeb 100%)`,
        }}
      />

      {/* L1b: Secondary micro-bands */}
      <AbsoluteFill
        style={{
          background: dark
            ? `linear-gradient(180deg,
                rgba(255,255,255,0.012) 0%, transparent 12%,
                rgba(255,255,255,0.018) 25%, transparent 38%,
                rgba(255,255,255,0.008) 50%, transparent 63%,
                rgba(255,255,255,0.015) 75%, transparent 100%)`
            : `linear-gradient(180deg,
                rgba(0,0,0,0.008) 0%, transparent 12%,
                rgba(0,0,0,0.012) 25%, transparent 38%,
                rgba(0,0,0,0.006) 50%, transparent 63%,
                rgba(0,0,0,0.01) 75%, transparent 100%)`,
        }}
      />

      {/* ── L2: Metal reflection — diagonal highlight ── */}
      <AbsoluteFill
        style={{
          background: dark
            ? `linear-gradient(155deg,
                transparent 0%,
                rgba(255,255,255,${0.025 * i}) 30%,
                rgba(255,255,255,${0.04 * i}) 50%,
                rgba(255,255,255,${0.025 * i}) 70%,
                transparent 100%)`
            : `linear-gradient(155deg,
                transparent 0%,
                rgba(255,255,255,${0.3 * i}) 30%,
                rgba(255,255,255,${0.5 * i}) 50%,
                rgba(255,255,255,${0.3 * i}) 70%,
                transparent 100%)`,
        }}
      />

      {/* ── L3 + L4: Gold dust orbs — 5 radial glows, animated with noise ── */}
      <GoldDustOrbs dark={dark} intensity={i} frame={frame} />

      {/* ── L5: Brush grain overlay ── */}
      <AbsoluteFill
        style={{
          background: dark
            ? `linear-gradient(182deg,
                rgba(255,255,255,${0.01 * i}) 0%, transparent 18%,
                rgba(255,255,255,${0.015 * i}) 35%, transparent 55%,
                rgba(255,255,255,${0.008 * i}) 72%, transparent 100%)`
            : `linear-gradient(182deg,
                rgba(0,0,0,${0.006 * i}) 0%, transparent 18%,
                rgba(0,0,0,${0.01 * i}) 35%, transparent 55%,
                rgba(0,0,0,${0.005 * i}) 72%, transparent 100%)`,
        }}
      />

      {/* ── L6: Vignette ── */}
      <Vignette dark={dark} intensity={i} frame={frame} />
    </AbsoluteFill>
  );
};

/** 5 asymmetric gold dust orbs — positions match the app exactly */
const GoldDustOrbs: React.FC<{
  dark: boolean;
  intensity: number;
  frame: number;
}> = ({ dark, intensity: i, frame }) => {
  // Subtle animated drift using noise
  const speed = 0.003;

  const orbs = [
    {
      // Dust A — upper left, largest, warmest
      color: "212, 175, 55",
      opacity: 0.09 * i,
      fadeOpacity: 0.03 * i,
      size: W * 0.45,
      top: H * 0.05,
      left: -(W * 0.45) * 0.15,
    },
    {
      // Dust B — center right, subtle
      color: "212, 175, 55",
      opacity: 0.03 * i,
      fadeOpacity: 0.008 * i,
      size: W * 0.3,
      top: H * 0.3,
      right: -(W * 0.3) * 0.1,
    },
    {
      // Dust C — lower center, wide and diffuse
      color: "207, 165, 51",
      opacity: 0.05 * i,
      fadeOpacity: 0.012 * i,
      size: W * 0.55,
      bottom: H * 0.15,
      left: W * 0.2,
    },
    {
      // Dust D — upper right corner, pinpoint, lighter gold
      color: "250, 240, 195",
      opacity: 0.07 * i,
      fadeOpacity: 0.02 * i,
      size: W * 0.2,
      top: H * 0.12,
      right: W * 0.08,
    },
    {
      // Dust E — lower left, medium warm
      color: "212, 175, 55",
      opacity: 0.04 * i,
      fadeOpacity: 0.01 * i,
      size: W * 0.35,
      bottom: H * 0.35,
      left: -(W * 0.35) * 0.2,
    },
  ];

  return (
    <>
      {orbs.map((orb, idx) => {
        // Noise-driven drift for organic movement
        const dx = noise3D("orbX", idx, 0, frame * speed) * 15;
        const dy = noise3D("orbY", 0, idx, frame * speed) * 15;

        const style: React.CSSProperties = {
          position: "absolute",
          width: orb.size,
          height: orb.size,
          borderRadius: "50%",
          background: `radial-gradient(circle,
            rgba(${orb.color}, ${orb.opacity}) 0%,
            rgba(${orb.color}, ${orb.fadeOpacity}) 40%,
            transparent 70%)`,
          transform: `translate(${dx}px, ${dy}px)`,
          pointerEvents: "none" as const,
        };

        if ("top" in orb && orb.top !== undefined)
          style.top = orb.top;
        if ("bottom" in orb && orb.bottom !== undefined)
          style.bottom = orb.bottom;
        if ("left" in orb && orb.left !== undefined)
          style.left = orb.left;
        if ("right" in orb && orb.right !== undefined)
          style.right = orb.right;

        return <div key={idx} style={style} />;
      })}
    </>
  );
};

/** Animated vignette with subtle pulse */
const Vignette: React.FC<{
  dark: boolean;
  intensity: number;
  frame: number;
}> = ({ dark, intensity: i, frame }) => {
  const pulse = interpolate(
    Math.sin(frame * 0.03),
    [-1, 1],
    dark ? [0.15 * i, 0.22 * i] : [0.03 * i, 0.06 * i]
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg,
          transparent 0%,
          transparent 65%,
          rgba(0, 0, 0, ${pulse}) 100%)`,
        pointerEvents: "none",
      }}
    />
  );
};
