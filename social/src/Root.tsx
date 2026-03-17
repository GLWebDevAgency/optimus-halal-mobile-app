import { Composition } from "remotion";
import { LogoReveal, logoRevealSchema } from "./compositions/LogoReveal";
import { IngredientReel, ingredientReelSchema } from "./compositions/IngredientReel";
import { MythBuster, mythBusterSchema } from "./compositions/MythBuster";
import { AyahWisdom, ayahWisdomSchema } from "./compositions/AyahWisdom";
import { CertificateurSpotlight, certSpotlightSchema } from "./compositions/CertificateurSpotlight";
import { MadhabCompare, madhabCompareSchema } from "./compositions/MadhabCompare";
import { ProductShowcase, productShowcaseSchema } from "./compositions/ProductShowcase";
import { PostShowcase, postShowcaseSchema } from "./compositions/PostShowcase";
import { PostShowcaseCTA, postShowcaseCtaSchema } from "./compositions/PostShowcaseCTA";
import { sizes } from "./theme";

export const RemotionRoot: React.FC = () => {
  const FPS = 30;

  return (
    <>
      {/* ── Logo Reveal — Dark ── */}
      <Composition
        id="LogoReveal"
        component={LogoReveal}
        schema={logoRevealSchema}
        durationInFrames={FPS * 15}
        fps={FPS}
        width={sizes.reel.width}
        height={sizes.reel.height}
        defaultProps={{ mode: "dark", showCta: true }}
      />

      {/* ── Logo Reveal — Light ── */}
      <Composition
        id="LogoRevealLight"
        component={LogoReveal}
        schema={logoRevealSchema}
        durationInFrames={FPS * 15}
        fps={FPS}
        width={sizes.reel.width}
        height={sizes.reel.height}
        defaultProps={{ mode: "light", showCta: true }}
      />

      {/* ── Splash — Dark ── */}
      <Composition
        id="SplashDark"
        component={LogoReveal}
        schema={logoRevealSchema}
        durationInFrames={FPS * 8}
        fps={FPS}
        width={sizes.reel.width}
        height={sizes.reel.height}
        defaultProps={{ mode: "dark", showCta: false }}
      />

      {/* ── Splash — Light ── */}
      <Composition
        id="SplashLight"
        component={LogoReveal}
        schema={logoRevealSchema}
        durationInFrames={FPS * 8}
        fps={FPS}
        width={sizes.reel.width}
        height={sizes.reel.height}
        defaultProps={{ mode: "light", showCta: false }}
      />

      {/* ── Ingredient Reel (15s) ── */}
      <Composition
        id="IngredientReel"
        component={IngredientReel}
        schema={ingredientReelSchema}
        durationInFrames={FPS * 15}
        fps={FPS}
        width={sizes.reel.width}
        height={sizes.reel.height}
        defaultProps={{
          ingredientName: "Vinaigre d'alcool",
          ingredientNameAr: "خل الكحول",
          rulingHanafi: "halal",
          rulingShafii: "doubtful",
          rulingMaliki: "doubtful",
          rulingHanbali: "halal",
          hookText: "4 SAVANTS, 2 RÉPONSES",
          sourceText: "Muslim 2051 · Bada'i al-Sana'i 5/113",
          lang: "fr",
          mode: "dark",
        }}
      />

      {/* ── MythBuster (15s) ── */}
      <Composition
        id="MythBuster"
        component={MythBuster}
        schema={mythBusterSchema}
        durationInFrames={FPS * 15}
        fps={FPS}
        width={sizes.reel.width}
        height={sizes.reel.height}
        defaultProps={{
          statement: "Le vinaigre d'alcool est toujours haram",
          verdict: "faux",
          explanation:
            "La transformation du vin en vinaigre est considérée comme complète par les Hanafites et Hanbalites.",
          madhabs: "Hanafi : halal · Hanbali : halal · Shafi'i : douteux · Maliki : douteux",
          sourceText: "Sahih Muslim 2051 · Bada'i al-Sana'i 5/113",
          mode: "dark",
        }}
      />

      {/* ── AyahWisdom (15s) ── */}
      <Composition
        id="AyahWisdom"
        component={AyahWisdom}
        schema={ayahWisdomSchema}
        durationInFrames={FPS * 15}
        fps={FPS}
        width={sizes.reel.width}
        height={sizes.reel.height}
        defaultProps={{
          arabicText: "يَا أَيُّهَا النَّاسُ كُلُوا مِمَّا فِي الْأَرْضِ حَلَالًا طَيِّبًا",
          translationFr: "Ô hommes ! Mangez de ce qui est licite et bon sur la terre.",
          reference: "Sourate Al-Baqara · 2:168",
          mode: "dark",
        }}
      />

      {/* ── Certificateur Spotlight (15s) ── */}
      <Composition
        id="CertificateurSpotlight"
        component={CertificateurSpotlight}
        schema={certSpotlightSchema}
        durationInFrames={FPS * 15}
        fps={FPS}
        width={sizes.reel.width}
        height={sizes.reel.height}
        defaultProps={{
          name: "AVS",
          country: "France",
          founded: "1991",
          trustScore: 100,
          tier: "S",
          controllersEmployees: true,
          controllersPresentEach: true,
          salariedSlaughterers: true,
          acceptsMechanical: false,
          acceptsElectronarcosis: false,
          acceptsStunning: false,
          mode: "dark",
        }}
      />

      {/* ── MadhabCompare (15s) ── */}
      <Composition
        id="MadhabCompare"
        component={MadhabCompare}
        schema={madhabCompareSchema}
        durationInFrames={FPS * 15}
        fps={FPS}
        width={sizes.reel.width}
        height={sizes.reel.height}
        defaultProps={{
          topic: "Vinaigre d'alcool",
          topicAr: "خل الكحول",
          hanafiRuling: "halal",
          hanafiReason:
            "L'istihala (transformation chimique complète) purifie la substance.",
          shafiiRuling: "doubtful",
          shafiiReason:
            "Al-Nawawi : halal seulement si la transformation est naturelle.",
          malikiRuling: "doubtful",
          malikiReason:
            "Fabrication intentionnelle = makruh. Ibn Rushd note deux avis.",
          hanbaliRuling: "halal",
          hanbaliReason:
            "Ibn Qudama : l'istihala complète purifie.",
          commonEvidence:
            "نِعْمَ الْأُدُمُ الْخَلُّ — Quel excellent condiment que le vinaigre !",
          sourceText:
            "Muslim 2051 · Muslim 1983 · Bada'i 5/113 · Al-Mughni 1/61",
          mode: "dark",
        }}
      />
      {/* ── NEW: ProductShowcase (15s, light, mockup + zoom + CTA) ── */}
      <Composition
        id="ProductShowcase"
        component={ProductShowcase}
        schema={productShowcaseSchema}
        durationInFrames={FPS * 15}
        fps={FPS}
        width={sizes.reel.width}
        height={sizes.reel.height}
        defaultProps={{
          ingredientName: "E471",
          ingredientNameAr: "أحادي وثنائي الغليسريد",
          description:
            "Mono et diglycérides d'acides gras — origine souvent animale (porc ou bœuf). Source rarement précisée par les fabricants.",
          rulingHanafi: "doubtful",
          rulingShafii: "doubtful",
          rulingMaliki: "doubtful",
          rulingHanbali: "doubtful",
          hookText: "E471 — Tu sais vraiment ce que c'est ?",
          sourceText: "IslamQA #114129 · ECFR · Codex Alimentarius",
          lang: "fr",
          mode: "light",
        }}
      />

      {/* ── Instagram Feed Post (1080x1080, 1:1 square) ── */}
      <Composition
        id="PostShowcase"
        component={PostShowcase}
        schema={postShowcaseSchema}
        durationInFrames={90}
        fps={FPS}
        width={1080}
        height={1080}
        defaultProps={{
          ingredientName: "E471",
          ingredientNameAr: "أحادي وثنائي الغليسريد",
          description:
            "Mono et diglycérides d'acides gras — origine souvent animale (porc ou bœuf). Source rarement précisée par les fabricants.",
          rulingHanafi: "doubtful",
          rulingShafii: "doubtful",
          rulingMaliki: "doubtful",
          rulingHanbali: "doubtful",
          hookText: "E471 — Tu sais vraiment ce que c'est ?",
          sourceText: "IslamQA #114129 · ECFR · Codex Alimentarius",
          mode: "light",
        }}
      />

      {/* ── Instagram Carousel Slide 2 — CTA (1080x1080) ── */}
      <Composition
        id="PostShowcaseCTA"
        component={PostShowcaseCTA}
        schema={postShowcaseCtaSchema}
        durationInFrames={30}
        fps={FPS}
        width={1080}
        height={1080}
        defaultProps={{
          ingredientName: "E471",
          ingredientNameAr: "أحادي وثنائي الغليسريد",
          description:
            "Mono et diglycérides d'acides gras — origine souvent animale (porc ou bœuf). Source rarement précisée par les fabricants.",
          rulingHanafi: "doubtful",
          rulingShafii: "doubtful",
          rulingMaliki: "doubtful",
          rulingHanbali: "doubtful",
          sourceText: "IslamQA #114129 · ECFR · Codex Alimentarius",
          mode: "light",
        }}
      />
    </>
  );
};
