import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  Img,
  staticFile,
} from "remotion";
import { z } from "zod";
import { noise3D } from "@remotion/noise";
import { evolvePath } from "@remotion/paths";
import { PremiumBackground } from "../components";
import { fonts, goldTextStyle } from "../theme";

const W = 1080;
const H = 1920;
const CX = W / 2;
const CY = H / 2 - 80;

// ── Theme tokens per mode ──
const TOKENS = {
  light: {
    textPrimary: "#0d1b13",
    textSecondary: "#4b5563",
    textMuted: "#9ca3af",
    gold: "#D4AF37",
    goldLight: "#E8D48B",
    goldDark: "#B8860B",
    greenLight: "#4CAF50",
    particleOpRange: [0.08, 0.35] as [number, number],
    sweepColor: "rgba(255,255,255,",
    exitBg: "#f3f1ed",
  },
  dark: {
    textPrimary: "#FFFFFF",
    textSecondary: "#A0A0A0",
    textMuted: "#6b7280",
    gold: "#D4AF37",
    goldLight: "#E8D48B",
    goldDark: "#B8860B",
    greenLight: "#4CAF50",
    particleOpRange: [0.04, 0.25] as [number, number],
    sweepColor: "rgba(232,212,139,",
    exitBg: "#0C0C0C",
  },
} as const;

export const logoRevealSchema = z.object({
  mode: z.enum(["light", "dark"]).default("light"),
  showCta: z.boolean().default(true),
});

type LogoRevealProps = z.infer<typeof logoRevealSchema>;

/**
 * LogoReveal v4 — Premium Brand Reveal (light + dark)
 *
 * Uses the app's exact PremiumBackground (7-layer brushed metal).
 * Tagline: "Scanne. Comprends. Choisis."
 *
 * Timeline (30fps = 450 frames):
 *   0-10    : PremiumBg hold
 *   10-40   : Noise particle field drifts in
 *   25-55   : SVG golden ring draws (evolvePath)
 *   35-70   : Logo springs in with rotation unwind
 *   65-90   : Light sweep
 *   90-130  : "NAQIY" letters stagger in (gold gradient)
 *   135-175 : "Scanne. Comprends. Choisis." words stagger
 *   175-205 : Decorative line expands
 *   210-240 : CTA "Bientôt disponible"
 *   240-370 : Hold
 *   370-430 : Scale up + fade
 *   430-450 : Exit to bg
 */
export const LogoReveal: React.FC<LogoRevealProps> = ({ mode = "light", showCta = true }) => {
  const frame = useCurrentFrame();
  const t = TOKENS[mode];

  const exitProgress = interpolate(frame, [370, 430], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const exitOpacity = 1 - exitProgress;
  const exitScale = 1 + exitProgress * 0.12;

  return (
    <AbsoluteFill>
      {/* ── App-exact PremiumBackground ── */}
      <PremiumBackground mode={mode} />

      {/* ── Audio — wind with swell at logo reveal ── */}
      <Audio
        src={staticFile("audio/wind-ambient.mp3")}
        startFrom={0}
        volume={(f) =>
          interpolate(f, [0, 25, 35, 60, 380, 450], [0, 0.5, 1, 0.7, 0.7, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />

      {/* ── Noise particle field ── */}
      <Sequence from={10}>
        <NoiseParticleField mode={mode} />
      </Sequence>

      {/* ── Main content ── */}
      <AbsoluteFill
        style={{
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        <Sequence from={25}>
          <GoldenRingDraw t={t} />
        </Sequence>

        <Sequence from={30}>
          <GlowBloom t={t} />
        </Sequence>

        <Sequence from={35}>
          <LogoEntrance />
        </Sequence>

        {/* ── Green leaf particles ── */}
        <Sequence from={40}>
          <LeafParticles mode={mode} />
        </Sequence>

        <Sequence from={65}>
          <LightSweep sweepColor={t.sweepColor} />
        </Sequence>

        <Sequence from={90}>
          <BrandNameStaggered />
        </Sequence>

        <Sequence from={135}>
          <TaglineStaggered t={t} />
        </Sequence>

        <Sequence from={175}>
          <DecorativeLine gold={t.gold} />
        </Sequence>

        {showCta && (
          <Sequence from={210}>
            <BottomCta t={t} />
          </Sequence>
        )}
      </AbsoluteFill>

      {/* ── Exit overlay ── */}
      <AbsoluteFill
        style={{
          backgroundColor: t.exitBg,
          opacity: interpolate(frame, [420, 450], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════

const NoiseParticleField: React.FC<{ mode: "light" | "dark" }> = ({ mode }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = TOKENS[mode];

  const globalOpacity = interpolate(frame, [0, 30, 330, 380], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const PARTICLE_COUNT = 55;
  const speed = 0.008;

  return (
    <AbsoluteFill style={{ opacity: globalOpacity }}>
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
        const baseX = noise3D("px", i * 0.7, 0, 0) * 0.5 + 0.5;
        const drift = (frame * 0.35 + i * 32) % (height + 200) - 100;
        const dx = noise3D("dx", i * 0.3, 0, frame * speed) * 70;
        const dy = noise3D("dy", 0, i * 0.3, frame * speed) * 50;
        const x = baseX * width + dx;
        const y = height - drift + dy;

        const sizeNoise = noise3D("size", i, 0, frame * 0.005);
        const size = interpolate(sizeNoise, [-1, 1], [1.5, 4.5]);

        const opNoise = noise3D("op", i * 0.5, frame * 0.01, 0);
        const opacity = interpolate(opNoise, [-1, 1], t.particleOpRange);

        const distFromCenter = Math.sqrt((x - CX) ** 2 + (y - CY) ** 2);
        const glow = interpolate(distFromCenter, [0, 400], [1.6, 1], {
          extrapolateRight: "clamp",
        });

        const color = i % 6 === 0 ? t.greenLight : t.gold;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - size / 2,
              top: y - size / 2,
              width: size * glow,
              height: size * glow,
              borderRadius: "50%",
              backgroundColor: color,
              opacity: opacity * glow,
              boxShadow:
                size > 3.2 ? `0 0 ${size * 3}px ${t.gold}44` : "none",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

interface TT {
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  gold: string;
  goldLight: string;
  goldDark: string;
  greenLight: string;
  particleOpRange: [number, number];
  sweepColor: string;
  exitBg: string;
}

const GoldenRingDraw: React.FC<{ t: TT }> = ({ t }) => {
  const frame = useCurrentFrame();

  const drawProgress = interpolate(frame, [0, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const pulseOpacity =
    frame > 60
      ? interpolate(Math.sin((frame - 60) * 0.06), [-1, 1], [0.3, 0.7])
      : interpolate(frame, [0, 30], [0, 0.7], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  const radius = 195;
  const path = `M ${CX} ${CY - radius} A ${radius} ${radius} 0 1 1 ${CX - 0.01} ${CY - radius}`;
  const { strokeDasharray, strokeDashoffset } = evolvePath(drawProgress, path);

  return (
    <AbsoluteFill>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <path
          d={path}
          fill="none"
          stroke={t.gold}
          strokeWidth={6}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          opacity={pulseOpacity * 0.25}
          filter="blur(10px)"
        />
        <path
          d={path}
          fill="none"
          stroke="url(#goldGrad)"
          strokeWidth={2}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          opacity={pulseOpacity}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={t.goldLight} />
            <stop offset="50%" stopColor={t.gold} />
            <stop offset="100%" stopColor={t.goldDark} />
          </linearGradient>
        </defs>
      </svg>
    </AbsoluteFill>
  );
};

const GlowBloom: React.FC<{ t: TT }> = ({ t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bloomIn = spring({
    frame,
    fps,
    config: { damping: 30, stiffness: 60 },
  });

  const pulse =
    frame > 30
      ? interpolate(Math.sin((frame - 30) * 0.05), [-1, 1], [0.85, 1.15])
      : 1;

  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: CX - 250,
        top: CY - 250,
        width: 500,
        height: 500,
        borderRadius: "50%",
        background: `radial-gradient(circle,
          ${t.gold}15 0%, ${t.gold}08 35%, transparent 70%)`,
        transform: `scale(${bloomIn * pulse})`,
        opacity,
      }}
    />
  );
};

/** LeafParticles — 4 green particles drifting from the logo's leaf. */
const LeafParticles: React.FC<{ mode: "light" | "dark" }> = ({ mode }) => {
  const frame = useCurrentFrame();

  const LEAF_X = CX + 65;
  const LEAF_Y = CY - 95;

  const particles = [
    { delay: 0, color: "#4CAF50", offsetX: -10, offsetY: -5 },
    { delay: 12, color: "#66BB6A", offsetX: 15, offsetY: -12 },
    { delay: 24, color: "#13ec6a", offsetX: -5, offsetY: 8 },
    { delay: 36, color: "#81C784", offsetX: 20, offsetY: 2 },
  ];

  const globalOpacity = interpolate(frame, [0, 15, 300, 340], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: globalOpacity, pointerEvents: "none" }}>
      {particles.map((p, i) => {
        const age = frame - p.delay;
        if (age < 0) return null;
        const localAge = age % 110;
        if (localAge > 95) return null;

        const driftY = -localAge * 2.2;
        const driftX = noise3D("ldx", i, 0, localAge * 0.01) * 30;

        const x = LEAF_X + p.offsetX + driftX;
        const y = LEAF_Y + p.offsetY + driftY;

        const size = interpolate(localAge, [0, 12, 55, 95], [2, 7, 5.5, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const baseOp = mode === "dark" ? 0.5 : 0.65;
        const opacity = interpolate(localAge, [0, 8, 60, 95], [0, baseOp, baseOp * 0.5, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - size / 2,
              top: y - size / 2,
              width: size,
              height: size,
              borderRadius: "50%",
              backgroundColor: p.color,
              opacity,
              boxShadow: `0 0 ${size * 3}px ${p.color}55`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const LogoEntrance: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100, mass: 0.8 },
  });

  const scale = interpolate(s, [0, 1], [0.6, 1]);
  const rot = interpolate(s, [0, 1], [-8, 0]);
  const opacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const SIZE = 320;

  return (
    <div
      style={{
        position: "absolute",
        left: CX - SIZE / 2,
        top: CY - SIZE / 2,
        width: SIZE,
        height: SIZE,
        transform: `scale(${scale}) rotate(${rot}deg)`,
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

const LightSweep: React.FC<{ sweepColor: string }> = ({ sweepColor }) => {
  const frame = useCurrentFrame();

  const sweepX = interpolate(frame, [0, 25], [-300, W + 300], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const opacity = interpolate(frame, [0, 8, 18, 25], [0, 0.5, 0.5, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: CY - 200,
        left: 0,
        width: W,
        height: 400,
        overflow: "hidden",
        opacity,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: sweepX,
          top: -50,
          width: 120,
          height: 500,
          background: `linear-gradient(90deg,
            transparent,
            ${sweepColor}0.4),
            ${sweepColor}0.7),
            ${sweepColor}0.4),
            transparent)`,
          transform: "rotate(-15deg)",
          filter: "blur(20px)",
        }}
      />
    </div>
  );
};

const BrandNameStaggered: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const letters = "NAQIY".split("");
  const DELAY = 5;

  return (
    <div
      style={{
        position: "absolute",
        top: CY + 210,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        gap: 8,
      }}
    >
      {letters.map((letter, i) => {
        const d = i * DELAY;
        const sp = spring({
          frame: frame - d,
          fps,
          config: { damping: 12, stiffness: 150, mass: 0.5 },
        });

        const opacity = interpolate(frame - d, [0, 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const ty = interpolate(sp, [0, 1], [30, 0]);

        return (
          <span
            key={i}
            style={{
              ...goldTextStyle,
              fontFamily: fonts.heading,
              fontSize: 82,
              fontWeight: 800,
              letterSpacing: 14,
              opacity,
              transform: `translateY(${ty}px)`,
              display: "inline-block",
            }}
          >
            {letter}
          </span>
        );
      })}
    </div>
  );
};

/** "Scanne. Comprends. Choisis." — 3 words staggered in */
const TaglineStaggered: React.FC<{ t: TT }> = ({ t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = ["Scanne.", "Comprends.", "Choisis."];
  const WORD_DELAY = 10;

  return (
    <div
      style={{
        position: "absolute",
        top: CY + 310,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        gap: 18,
      }}
    >
      {words.map((word, i) => {
        const d = i * WORD_DELAY;

        const sp = spring({
          frame: frame - d,
          fps,
          config: { damping: 16, stiffness: 120, mass: 0.6 },
        });

        const opacity = interpolate(frame - d, [0, 12], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const ty = interpolate(sp, [0, 1], [20, 0]);

        const blur = interpolate(frame - d, [0, 15], [6, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <span
            key={i}
            style={{
              fontFamily: fonts.body,
              fontSize: 38,
              fontWeight: 500,
              color: t.textSecondary,
              letterSpacing: 1,
              opacity,
              transform: `translateY(${ty}px)`,
              filter: `blur(${blur}px)`,
              display: "inline-block",
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

const DecorativeLine: React.FC<{ gold: string }> = ({ gold }) => {
  const frame = useCurrentFrame();

  const width = interpolate(frame, [0, 30], [0, 400], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: CY + 370,
        left: CX - width / 2,
        width,
        height: 1,
        background: `linear-gradient(90deg, transparent, ${gold}88, transparent)`,
        opacity,
      }}
    />
  );
};

const BottomCta: React.FC<{ t: TT }> = ({ t }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 25], [0, 0.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ty = interpolate(frame, [0, 25], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const breathe =
    frame > 30
      ? interpolate(Math.sin((frame - 30) * 0.04), [-1, 1], [0.45, 0.65])
      : opacity;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 140,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        opacity: frame > 30 ? breathe : opacity,
        transform: `translateY(${ty}px)`,
      }}
    >
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: 26,
          color: t.textMuted,
          letterSpacing: 6,
          textTransform: "uppercase",
          fontWeight: 300,
        }}
      >
        Bientôt disponible
      </span>
      <div
        style={{
          width: 40,
          height: 2,
          background: t.gold,
          opacity: 0.4,
          borderRadius: 1,
        }}
      />
    </div>
  );
};
