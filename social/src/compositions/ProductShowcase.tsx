import {
  AbsoluteFill,
  Audio,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  staticFile,
} from "remotion";
import { z } from "zod";
import { PremiumBackground, NaqiyLogo } from "../components";
import { IPhoneMockup } from "../components/IPhoneMockup";
import { MockScanScreen } from "../components/MockScanScreen";
import { fonts, colors, goldTextStyle } from "../theme";

/**
 * ProductShowcase — App-centric Instagram reel (15s).
 *
 * Two-part structure:
 *   SLIDE 1 (0–9s): Hook text + iPhone mockup with scan screen
 *   TRANSITION (9–11s): Camera zooms into the phone screen
 *   SLIDE 2 (11–15s): Phone content fills the canvas + download CTA
 *
 * Duration: 15s (450 frames @ 30fps)
 */

const rulingEnum = z.enum(["halal", "haram", "doubtful", "unknown"]);

export const productShowcaseSchema = z.object({
  ingredientName: z.string(),
  ingredientNameAr: z.string().optional(),
  rulingHanafi: rulingEnum,
  rulingShafii: rulingEnum,
  rulingMaliki: rulingEnum,
  rulingHanbali: rulingEnum,
  description: z.string().optional(),
  hookText: z.string().optional(),
  sourceText: z.string().optional(),
  lang: z.enum(["fr", "en", "ar"]).default("fr"),
  mode: z.enum(["light", "dark"]).default("light"),
});

type Props = z.infer<typeof productShowcaseSchema>;

export const ProductShowcase: React.FC<Props> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const hook =
    props.hookText || `${props.ingredientName} — Tu sais d'ou ca vient ?`;

  // ═══════════════════════════════════════════
  // SLIDE 1 — iPhone mockup (frames 0–270)
  // ═══════════════════════════════════════════

  // Hook text spring-in
  const hookSc = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 100 },
  });
  const hookTy = interpolate(hookSc, [0, 1], [-40, 0]);
  const hookOp = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Sub-hook fade-in
  const subOp = interpolate(frame, [12, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Footer spring-in
  const footerSc = spring({
    frame: frame - 185,
    fps,
    config: { damping: 18, stiffness: 100 },
  });
  const footerTy = interpolate(footerSc, [0, 1], [20, 0]);
  const footerOp = interpolate(frame, [185, 210], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ═══════════════════════════════════════════
  // ZOOM TRANSITION (frames 270–330)
  // ═══════════════════════════════════════════

  // Text elements fade out
  const textFadeOut = interpolate(frame, [270, 300], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Mockup zooms into the screen
  const zoomProgress = spring({
    frame: frame - 270,
    fps,
    config: { damping: 30, stiffness: 80 },
  });
  const zoomScale = interpolate(zoomProgress, [0, 1], [1, 2.5]);
  const zoomTy = interpolate(zoomProgress, [0, 1], [0, -400]);

  // ═══════════════════════════════════════════
  // SLIDE 2 — CTA overlay (frames 330–450)
  // ═══════════════════════════════════════════

  const ctaOp = interpolate(frame, [340, 375], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaSc = spring({
    frame: frame - 350,
    fps,
    config: { damping: 20, stiffness: 120 },
  });
  const ctaTy = interpolate(ctaSc, [0, 1], [30, 0]);

  return (
    <AbsoluteFill>
      {/* ── Background (continuous) ── */}
      <PremiumBackground mode="light" intensity={0.7} />

      {/* ── Audio (15s envelope) ── */}
      <Audio
        src={staticFile("audio/wind-ambient.mp3")}
        volume={(f) =>
          interpolate(f, [0, 30, 410, 450], [0, 0.08, 0.08, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />

      {/* ── Hook Text (fades out during zoom) ── */}
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 60,
          right: 60,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          transform: `translateY(${hookTy}px)`,
          opacity: hookOp * textFadeOut,
        }}
      >
        <span
          style={{
            fontFamily: fonts.heading,
            fontSize: 42,
            fontWeight: 800,
            color: "#1A1A1A",
            textAlign: "center",
            lineHeight: 1.15,
          }}
        >
          {hook}
        </span>
      </div>

      {/* ── Sub-hook (fades out during zoom) ── */}
      <div
        style={{
          position: "absolute",
          top: 260,
          left: 60,
          right: 60,
          display: "flex",
          justifyContent: "center",
          opacity: subOp * textFadeOut,
        }}
      >
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 20,
            fontWeight: 400,
            color: "rgba(0,0,0,0.4)",
            textAlign: "center",
          }}
        >
          Avis des 4 ecoles juridiques
        </span>
      </div>

      {/* ── iPhone Mockup (zooms in during transition) ── */}
      <div
        style={{
          position: "absolute",
          top: 330,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          transform: `translateY(${zoomTy}px) scale(${zoomScale})`,
          transformOrigin: "center top",
        }}
      >
        <IPhoneMockup width={480} enterDelay={12} dark={false}>
          <MockScanScreen
            productName={props.ingredientName}
            productNameAr={props.ingredientNameAr}
            description={props.description}
            rulingHanafi={props.rulingHanafi}
            rulingShafii={props.rulingShafii}
            rulingMaliki={props.rulingMaliki}
            rulingHanbali={props.rulingHanbali}
            sourceText={props.sourceText}
            enterDelay={30}
          />
        </IPhoneMockup>
      </div>

      {/* ── Footer (fades out during zoom) ── */}
      <div
        style={{
          position: "absolute",
          bottom: 220,
          left: 60,
          right: 60,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          transform: `translateY(${footerTy}px)`,
          opacity: footerOp * textFadeOut,
        }}
      >
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 22,
            fontWeight: 500,
            color: "rgba(0,0,0,0.45)",
            textAlign: "center",
          }}
        >
          Comprends ce que tu manges.
        </span>
        <span
          style={{
            ...goldTextStyle,
            fontFamily: fonts.heading,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 3,
          }}
        >
          @naqiy
        </span>
      </div>

      {/* ── Logo slide 1 (fades out during zoom) ── */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: textFadeOut,
        }}
      >
        <NaqiyLogo size={60} enterDelay={195} />
      </div>

      {/* ═══ SLIDE 2 — Download CTA ═══ */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingTop: 150,
          paddingBottom: 80,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 20,
          background:
            "linear-gradient(0deg, #f3f1ed 0%, rgba(243,241,237,0.98) 45%, rgba(243,241,237,0) 100%)",
          opacity: ctaOp,
          transform: `translateY(${ctaTy}px)`,
        }}
      >
        <span
          style={{
            fontFamily: fonts.heading,
            fontSize: 36,
            fontWeight: 800,
            color: "#1A1A1A",
            textAlign: "center",
            lineHeight: 1.2,
            padding: "0 60px",
          }}
        >
          Et toi, tu sais{"\n"}ce que tu manges ?
        </span>

        <div
          style={{
            marginTop: 8,
            padding: "18px 56px",
            borderRadius: 32,
            background: `linear-gradient(135deg, ${colors.gold}, #E8C847)`,
            boxShadow: `0 8px 24px ${colors.gold}40`,
          }}
        >
          <span
            style={{
              fontFamily: fonts.heading,
              fontSize: 22,
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: 1,
            }}
          >
            Telecharge Naqiy
          </span>
        </div>

        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 18,
            fontWeight: 400,
            color: "rgba(0,0,0,0.4)",
          }}
        >
          L'app qui t'informe, sans te juger.
        </span>

        <span
          style={{
            ...goldTextStyle,
            fontFamily: fonts.heading,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 3,
            marginTop: 4,
          }}
        >
          @naqiy
        </span>
      </div>
    </AbsoluteFill>
  );
};
