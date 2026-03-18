import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { PremiumBackground, NaqiyLogo } from "../components";
import { IPhoneMockup } from "../components/IPhoneMockup";
import { MockScanScreen } from "../components/MockScanScreen";
import { fonts, goldTextStyle } from "../theme";

/**
 * PostShowcase — Instagram feed post (1080x1080, 1:1 square).
 *
 * Static version of the ProductShowcase reel.
 * Rendered as a still frame (frame ~60) where all springs have settled.
 *
 * Layout:
 *   [PremiumBackground light]
 *   [Hook text + sub-hook]    — top zone
 *   [IPhoneMockup]            — center hero
 *     [MockScanScreen]        — inside mockup
 *   [Footer + logo + @naqiy]  — bottom zone
 */

const rulingEnum = z.enum(["halal", "haram", "doubtful", "unknown"]);

export const postShowcaseSchema = z.object({
  ingredientName: z.string(),
  ingredientNameAr: z.string().optional(),
  description: z.string().optional(),
  rulingHanafi: rulingEnum,
  rulingShafii: rulingEnum,
  rulingMaliki: rulingEnum,
  rulingHanbali: rulingEnum,
  hookText: z.string().optional(),
  sourceText: z.string().optional(),
  mode: z.enum(["light", "dark"]).default("light"),
});

type Props = z.infer<typeof postShowcaseSchema>;

export const PostShowcase: React.FC<Props> = (props) => {
  const hook =
    props.hookText ||
    `${props.ingredientName} — Tu sais vraiment ce que c'est ?`;

  return (
    <AbsoluteFill>
      <PremiumBackground mode="light" intensity={0.7} />

      {/* ── Hook text ── */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 50,
          right: 50,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            fontFamily: fonts.heading,
            fontSize: 30,
            fontWeight: 800,
            color: "#1A1A1A",
            textAlign: "center",
            lineHeight: 1.15,
          }}
        >
          {hook}
        </span>
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 15,
            fontWeight: 400,
            color: "rgba(0,0,0,0.4)",
            textAlign: "center",
          }}
        >
          Avis des 4 ecoles juridiques
        </span>
      </div>

      {/* ── iPhone Mockup ── */}
      <div
        style={{
          position: "absolute",
          top: 150,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <IPhoneMockup width={300} enterDelay={0} dark={false}>
          <MockScanScreen
            productName={props.ingredientName}
            productNameAr={props.ingredientNameAr}
            description={props.description}
            rulingHanafi={props.rulingHanafi}
            rulingShafii={props.rulingShafii}
            rulingMaliki={props.rulingMaliki}
            rulingHanbali={props.rulingHanbali}
            sourceText={props.sourceText}
            enterDelay={0}
          />
        </IPhoneMockup>
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          position: "absolute",
          bottom: 36,
          left: 50,
          right: 50,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <NaqiyLogo size={48} enterDelay={0} />
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 17,
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
