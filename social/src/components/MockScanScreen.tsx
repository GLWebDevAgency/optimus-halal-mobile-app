import { useCurrentFrame, interpolate } from "remotion";
import { colors, fonts, goldTextStyle, rulingColor, rulingLabel } from "../theme";

/**
 * MockScanScreen — Simplified replica of the Naqiy scan result screen.
 *
 * Renders inside IPhoneMockup. Shows:
 *   - App bar with "NAQIY" in gold
 *   - Product name (large)
 *   - 4 madhab verdict circles (SVG rings with colored fill + center icon)
 *   - Source attribution (small, muted)
 *
 * Light theme version matching the real app's light mode.
 */

type Ruling = "halal" | "haram" | "doubtful" | "unknown";

interface MockScanScreenProps {
  productName: string;
  productNameAr?: string;
  description?: string;
  rulingHanafi: Ruling;
  rulingShafii: Ruling;
  rulingMaliki: Ruling;
  rulingHanbali: Ruling;
  sourceText?: string;
  enterDelay?: number;
}

const SCHOOLS = [
  { key: "hanafi", label: "Hanafite" },
  { key: "shafii", label: "Chafiite" },
  { key: "maliki", label: "Malikite" },
  { key: "hanbali", label: "Hanbalite" },
] as const;

const RULING_ICON: Record<Ruling, string> = {
  halal: "\u2713",    // ✓
  haram: "\u2717",    // ✗
  doubtful: "\u26A0", // ⚠
  unknown: "?",
};

const RING_SIZE = 76;
const RING_STROKE = 5;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** Maps ruling to a fill percentage for the ring arc */
const rulingFill = (r: Ruling): number => {
  switch (r) {
    case "halal": return 0.85;
    case "haram": return 0.25;
    case "doubtful": return 0.55;
    default: return 0.15;
  }
};

/** Determine the overall product status from 4 rulings */
const overallStatus = (rulings: Ruling[]): Ruling => {
  if (rulings.every((r) => r === "halal")) return "halal";
  if (rulings.some((r) => r === "haram")) return "haram";
  if (rulings.some((r) => r === "doubtful")) return "doubtful";
  return "unknown";
};

const STATUS_GRADIENT: Record<Ruling, string> = {
  halal: "linear-gradient(180deg, rgba(34,197,94,0.12) 0%, transparent 100%)",
  haram: "linear-gradient(180deg, rgba(239,68,68,0.12) 0%, transparent 100%)",
  doubtful: "linear-gradient(180deg, rgba(245,158,11,0.12) 0%, transparent 100%)",
  unknown: "linear-gradient(180deg, rgba(107,114,128,0.08) 0%, transparent 100%)",
};

export const MockScanScreen: React.FC<MockScanScreenProps> = ({
  productName,
  productNameAr,
  description,
  rulingHanafi,
  rulingShafii,
  rulingMaliki,
  rulingHanbali,
  sourceText,
  enterDelay = 0,
}) => {
  const frame = useCurrentFrame();
  const rulings: Ruling[] = [rulingHanafi, rulingShafii, rulingMaliki, rulingHanbali];
  const status = overallStatus(rulings);

  // Content fade-in
  const contentOp = interpolate(frame - enterDelay, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#FAFAF8",
        display: "flex",
        flexDirection: "column",
        fontFamily: fonts.body,
        opacity: contentOp,
      }}
    >
      {/* ── App Bar ── */}
      <div
        style={{
          height: 96,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          paddingTop: 50,
          paddingBottom: 12,
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <span
          style={{
            ...goldTextStyle,
            fontFamily: fonts.heading,
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: 4,
          }}
        >
          NAQIY
        </span>
      </div>

      {/* ── Status Hero ── */}
      <div
        style={{
          background: STATUS_GRADIENT[status],
          padding: "32px 24px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        {/* Product name */}
        <span
          style={{
            fontFamily: fonts.heading,
            fontSize: 24,
            fontWeight: 800,
            color: "#1A1A1A",
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          {productName}
        </span>
        {productNameAr && (
          <span
            style={{
              fontFamily: fonts.arabic,
              fontSize: 14,
              color: "rgba(0,0,0,0.35)",
              direction: "rtl",
            }}
          >
            {productNameAr}
          </span>
        )}
        {description && (
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: 11,
              fontWeight: 400,
              color: "rgba(0,0,0,0.45)",
              textAlign: "center",
              lineHeight: 1.4,
              marginTop: 4,
              padding: "0 12px",
            }}
          >
            {description}
          </span>
        )}

        {/* Status label */}
        <div
          style={{
            marginTop: 8,
            padding: "4px 14px",
            borderRadius: 12,
            backgroundColor: `${rulingColor(status)}18`,
            border: `1px solid ${rulingColor(status)}30`,
          }}
        >
          <span
            style={{
              fontFamily: fonts.heading,
              fontSize: 11,
              fontWeight: 700,
              color: rulingColor(status),
              letterSpacing: 2,
            }}
          >
            {rulingLabel(status)}
          </span>
        </div>
      </div>

      {/* ── Section label ── */}
      <div
        style={{
          padding: "20px 24px 12px",
        }}
      >
        <span
          style={{
            fontFamily: fonts.heading,
            fontSize: 11,
            fontWeight: 600,
            color: "rgba(0,0,0,0.35)",
            letterSpacing: 2,
          }}
        >
          AVIS DES 4 ECOLES
        </span>
      </div>

      {/* ── Madhab Rings Row ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 18,
          padding: "12px 16px 24px",
        }}
      >
        {SCHOOLS.map((school, i) => {
          const ruling = rulings[i];
          const color = rulingColor(ruling);
          const fill = rulingFill(ruling);
          const dashOffset = RING_CIRCUMFERENCE * (1 - fill);

          // Stagger animation per circle
          const circleOp = interpolate(
            frame - enterDelay - (i * 4),
            [8, 22],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <div
              key={school.key}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                opacity: circleOp,
              }}
            >
              {/* Ring */}
              <div style={{ position: "relative", width: RING_SIZE, height: RING_SIZE }}>
                <svg width={RING_SIZE} height={RING_SIZE}>
                  {/* Background track */}
                  <circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    fill="none"
                    stroke="rgba(0,0,0,0.06)"
                    strokeWidth={RING_STROKE}
                  />
                  {/* Progress arc */}
                  <circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    fill="none"
                    stroke={color}
                    strokeWidth={RING_STROKE}
                    strokeLinecap="round"
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={dashOffset}
                    transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                  />
                </svg>
                {/* Center icon */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: RING_SIZE,
                    height: RING_SIZE,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: 22, color }}>{RULING_ICON[ruling]}</span>
                </div>
              </div>

              {/* School label */}
              <span
                style={{
                  fontFamily: fonts.heading,
                  fontSize: 10,
                  fontWeight: 600,
                  color: "rgba(0,0,0,0.4)",
                  letterSpacing: 0.5,
                }}
              >
                {school.label}
              </span>

              {/* Verdict label */}
              <span
                style={{
                  fontFamily: fonts.heading,
                  fontSize: 9,
                  fontWeight: 700,
                  color,
                  letterSpacing: 0.5,
                }}
              >
                {rulingLabel(ruling)}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Divider ── */}
      <div
        style={{
          height: 1,
          backgroundColor: "rgba(0,0,0,0.06)",
          margin: "0 24px",
        }}
      />

      {/* ── Source text ── */}
      {sourceText && (
        <div
          style={{
            padding: "18px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <span
            style={{
              fontFamily: fonts.heading,
              fontSize: 9,
              fontWeight: 600,
              color: "rgba(0,0,0,0.3)",
              letterSpacing: 1.5,
            }}
          >
            SOURCES
          </span>
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: 10,
              fontWeight: 400,
              color: "rgba(0,0,0,0.45)",
              lineHeight: 1.5,
            }}
          >
            {sourceText}
          </span>
        </div>
      )}

      {/* ── Bottom action hint ── */}
      <div
        style={{
          padding: "24px 24px 28px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            padding: "8px 28px",
            borderRadius: 20,
            backgroundColor: `${colors.gold}15`,
            border: `1px solid ${colors.gold}30`,
          }}
        >
          <span
            style={{
              fontFamily: fonts.heading,
              fontSize: 11,
              fontWeight: 600,
              color: colors.gold,
              letterSpacing: 1,
            }}
          >
            Scanne. Comprends. Choisis.
          </span>
        </div>
      </div>
    </div>
  );
};
