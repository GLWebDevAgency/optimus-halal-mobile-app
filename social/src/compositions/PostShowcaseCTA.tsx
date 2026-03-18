import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { PremiumBackground, NaqiyLogo } from "../components";
import { fonts, colors, goldTextStyle, rulingColor, rulingLabel } from "../theme";

/**
 * PostShowcaseCTA — Instagram carousel slide 2 (1080x1080, 1:1 square).
 *
 * Info card with ingredient details + download CTA.
 * Matches the reel's slide 2 but as a static image for carousel.
 */

const rulingEnum = z.enum(["halal", "haram", "doubtful", "unknown"]);

export const postShowcaseCtaSchema = z.object({
  ingredientName: z.string(),
  ingredientNameAr: z.string().optional(),
  description: z.string().optional(),
  rulingHanafi: rulingEnum,
  rulingShafii: rulingEnum,
  rulingMaliki: rulingEnum,
  rulingHanbali: rulingEnum,
  sourceText: z.string().optional(),
  mode: z.enum(["light", "dark"]).default("light"),
});

type Props = z.infer<typeof postShowcaseCtaSchema>;

const SCHOOLS = [
  { key: "hanafi", label: "Hanafite", prop: "rulingHanafi" as const },
  { key: "shafii", label: "Chafiite", prop: "rulingShafii" as const },
  { key: "maliki", label: "Malikite", prop: "rulingMaliki" as const },
  { key: "hanbali", label: "Hanbalite", prop: "rulingHanbali" as const },
];

export const PostShowcaseCTA: React.FC<Props> = (props) => {
  const rulings = SCHOOLS.map((s) => ({
    ...s,
    ruling: props[s.prop],
  }));

  return (
    <AbsoluteFill>
      <PremiumBackground mode="light" intensity={0.7} />

      {/* ── Title ── */}
      <div
        style={{
          position: "absolute",
          top: 44,
          left: 50,
          right: 50,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: fonts.heading,
            fontSize: 32,
            fontWeight: 800,
            color: "#1A1A1A",
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          Et toi, tu sais{"\n"}ce que tu manges ?
        </span>
      </div>

      {/* ── Info Card ── */}
      <div
        style={{
          position: "absolute",
          top: 160,
          left: 44,
          right: 44,
          backgroundColor: "rgba(255,255,255,0.85)",
          borderRadius: 22,
          padding: "28px 30px",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Ingredient name */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: fonts.heading,
              fontSize: 30,
              fontWeight: 800,
              color: "#1A1A1A",
            }}
          >
            {props.ingredientName}
          </span>
          {props.ingredientNameAr && (
            <span
              style={{
                fontFamily: fonts.arabic,
                fontSize: 17,
                color: "rgba(0,0,0,0.35)",
                direction: "rtl",
              }}
            >
              {props.ingredientNameAr}
            </span>
          )}
        </div>

        {/* Description */}
        {props.description && (
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: 16,
              fontWeight: 400,
              color: "rgba(0,0,0,0.55)",
              textAlign: "center",
              lineHeight: 1.45,
            }}
          >
            {props.description}
          </span>
        )}

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: "rgba(0,0,0,0.06)" }} />

        {/* Section label */}
        <span
          style={{
            fontFamily: fonts.heading,
            fontSize: 12,
            fontWeight: 600,
            color: "rgba(0,0,0,0.3)",
            letterSpacing: 2,
            textAlign: "center",
          }}
        >
          AVIS DES 4 ECOLES
        </span>

        {/* 2x2 Madhab grid */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "center",
          }}
        >
          {rulings.map((school) => {
            const color = rulingColor(school.ruling);
            return (
              <div
                key={school.key}
                style={{
                  width: "46%",
                  padding: "12px 16px",
                  borderRadius: 14,
                  backgroundColor: `${color}08`,
                  borderLeft: `3px solid ${color}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                }}
              >
                <span
                  style={{
                    fontFamily: fonts.heading,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "rgba(0,0,0,0.5)",
                  }}
                >
                  {school.label}
                </span>
                <span
                  style={{
                    fontFamily: fonts.heading,
                    fontSize: 16,
                    fontWeight: 700,
                    color,
                  }}
                >
                  {rulingLabel(school.ruling)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Sources */}
        {props.sourceText && (
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: 12,
              fontWeight: 400,
              color: "rgba(0,0,0,0.3)",
              textAlign: "center",
            }}
          >
            Sources : {props.sourceText}
          </span>
        )}
      </div>

      {/* ── CTA ── */}
      <div
        style={{
          position: "absolute",
          bottom: 36,
          left: 50,
          right: 50,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            padding: "16px 48px",
            borderRadius: 32,
            background: `linear-gradient(135deg, ${colors.gold}, #E8C847)`,
            boxShadow: `0 8px 24px ${colors.gold}40`,
          }}
        >
          <span
            style={{
              fontFamily: fonts.heading,
              fontSize: 20,
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
            fontSize: 15,
            fontWeight: 400,
            color: "rgba(0,0,0,0.4)",
          }}
        >
          L'app qui t'informe, sans te juger.
        </span>

        <NaqiyLogo size={44} enterDelay={-100} />

        <span
          style={{
            ...goldTextStyle,
            fontFamily: fonts.heading,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 3,
          }}
        >
          @naqiy
        </span>
      </div>
    </AbsoluteFill>
  );
};
