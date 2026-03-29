"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  type MotionValue,
  useScroll,
  useTransform,
  motion,
  AnimatePresence,
} from "motion/react";
import {
  ShieldCheck,
  Heartbeat,
  MagnifyingGlass,
  Knife,
  Path,
  Eye,
  Warning,
  Leaf,
  CheckCircle,
  ArrowRight,
} from "@phosphor-icons/react";

/* ═══════════════════════════════════════════════
   Data — Halal panel
   ═══════════════════════════════════════════════ */

const TRUST_GRADES = [
  { grade: 1, arabic: "١", label: "Très fiable",            color: "#22c55e", range: "≥ 90" },
  { grade: 2, arabic: "٢", label: "Fiable",                 color: "#84cc16", range: "70–89" },
  { grade: 3, arabic: "٣", label: "Vigilance",              color: "#f59e0b", range: "51–69" },
  { grade: 4, arabic: "٤", label: "Peu fiable",             color: "#f97316", range: "35–50" },
  { grade: 5, arabic: "٥", label: "Pas fiable du tout",     color: "#ef4444", range: "< 35" },
] as const;

const CRITERIA = [
  { icon: Knife,           title: "Abattage",       description: "Rituel vérifié, bismillah, sacrificateur pratiquant." },
  { icon: Path,            title: "Traçabilité",    description: "De l'élevage à l'assiette, chaque maillon audité." },
  { icon: Eye,             title: "Contrôles",      description: "Présence physique en abattoir et en usine." },
  { icon: MagnifyingGlass, title: "Indépendance",   description: "Le certifieur est-il payé par ceux qu'il certifie ?" },
];

const CERTIFIER_LOGOS = [
  { name: "AVS",           src: "/images/certifications/avs.webp" },
  { name: "Achahada",      src: "/images/certifications/achahada.webp" },
  { name: "ACMIF",         src: "/images/certifications/acmif.webp" },
  { name: "AFCAI",         src: "/images/certifications/afcai.webp" },
  { name: "Al-Takwa",      src: "/images/certifications/altakwa.webp" },
  { name: "ARGML",         src: "/images/certifications/argml.webp" },
  { name: "EHT",           src: "/images/certifications/eht.webp" },
  { name: "Halal Correct", src: "/images/certifications/halal_correct.webp" },
  { name: "HMC",           src: "/images/certifications/hmc.webp" },
  { name: "ICA",           src: "/images/certifications/ica.webp" },
  { name: "MCI",           src: "/images/certifications/mci.webp" },
  { name: "SFCVH",         src: "/images/certifications/sfcvh.webp" },
];

/* ═══════════════════════════════════════════════
   Data — Santé panel
   ═══════════════════════════════════════════════ */

const HEALTH_SCORE = { score: 68, label: "BON", color: "#22c55e" } as const;
const HEALTH_RING_SIZE = 72;
const HEALTH_RING_R = 30;
const HEALTH_RING_STROKE = 5;
const HEALTH_RING_CIRC = 2 * Math.PI * HEALTH_RING_R;

const NUTRI_GRADES = [
  { grade: "A", color: "#007140" },
  { grade: "B", color: "#85BB2F" },
  { grade: "C", color: "#FBCA04" },
  { grade: "D", color: "#EF8200" },
  { grade: "E", color: "#E63312" },
];

const NOVA_LEVELS = [
  { level: 1, label: "Bruts",         color: "#22c55e" },
  { level: 2, label: "Culinaires",    color: "#84cc16" },
  { level: 3, label: "Transformés",   color: "#f59e0b" },
  { level: 4, label: "Ultra-proc.",   color: "#ef4444" },
];

const ADDITIF_STATS = [
  { label: "Sans risque connu", count: 8, color: "#22c55e" },
  { label: "À surveiller",      count: 2, color: "#f59e0b" },
  { label: "À risque",          count: 1, color: "#ef4444" },
];

/* ═══════════════════════════════════════════════
   Panel indicator (desktop)
   ═══════════════════════════════════════════════ */

function PanelIndicator({ progress }: { progress: MotionValue<number> }) {
  const trackWidth = useTransform(progress, [0, 1], ["0%", "100%"]);

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <div className="flex items-center gap-3 rounded-full bg-background/70 backdrop-blur-md border border-border/40 px-4 py-2 shadow-xl">
        <span className="text-xs font-semibold text-foreground/60">Halal</span>
        <div className="relative h-0.5 w-16 rounded-full bg-border overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: trackWidth,
              background: "linear-gradient(to right, oklch(0.76 0.14 88), oklch(0.7 0.18 145))",
            }}
          />
        </div>
        <span className="text-xs font-semibold text-foreground/60">Santé</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Halal panel content
   ═══════════════════════════════════════════════ */

function HalalPanelContent() {
  return (
    <div className="flex flex-col gap-5 max-w-lg w-full">
      {/* Header */}
      <div>
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-xs font-semibold text-gold">
          <ShieldCheck className="size-3" weight="fill" />
          01 — Halal
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground max-w-sm">
          Tous les certifieurs ne se valent pas.{" "}
          <span className="font-semibold text-foreground">Naqiy les évalue sur des critères concrets</span>
          {" "}— pour que tu saches vraiment à qui tu fais confiance.
        </p>
      </div>

      {/* Score strip */}
      <div className="inline-flex items-center gap-1.5 rounded-2xl bg-card px-4 py-3 shadow-sm w-fit">
        <span className="mr-1 text-base font-black text-gold select-none">N</span>
        {TRUST_GRADES.map((g) => {
          const isActive = g.grade === 1;
          return (
            <div
              key={g.grade}
              className="flex items-center justify-center rounded-lg font-black text-white transition-all duration-200"
              style={{
                backgroundColor: g.color,
                opacity: isActive ? 1 : 0.2,
                width: isActive ? 50 : 28,
                height: isActive ? 30 : 24,
                fontSize: isActive ? 17 : 12,
              }}
            >
              {g.arabic}
            </div>
          );
        })}
        <span className="ml-2 text-sm font-semibold hidden sm:inline" style={{ color: TRUST_GRADES[0].color }}>
          Très fiable
        </span>
      </div>

      {/* Grade cards compact */}
      <div className="grid grid-cols-5 gap-1.5 max-w-xs">
        {TRUST_GRADES.map((g) => (
          <div key={g.grade} className="rounded-xl bg-card p-2 text-center shadow-sm">
            <div
              className="mx-auto mb-1 inline-flex items-center justify-center rounded-md font-black text-white"
              style={{ backgroundColor: g.color, width: 26, height: 20, fontSize: 11 }}
            >
              {g.arabic}
            </div>
            <p className="text-[9px] font-semibold text-foreground leading-tight">{g.label}</p>
            <p className="text-[8px] text-muted-foreground">{g.range}</p>
          </div>
        ))}
      </div>

      {/* Criteria 2×2 */}
      <div className="grid grid-cols-2 gap-2 max-w-sm">
        {CRITERIA.map((c) => (
          <div key={c.title} className="rounded-xl bg-card p-3 shadow-sm ring-1 ring-border/50">
            <div className="mb-2 inline-flex size-7 items-center justify-center rounded-lg bg-leaf/10">
              <c.icon className="size-3.5 text-leaf" weight="fill" />
            </div>
            <p className="text-xs font-bold text-foreground">{c.title}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground leading-relaxed">{c.description}</p>
          </div>
        ))}
      </div>

      {/* Certifiers row */}
      <div className="flex items-center gap-3">
        <div className="flex -space-x-1.5">
          {CERTIFIER_LOGOS.slice(0, 6).map((logo) => (
            <div
              key={logo.name}
              className="inline-flex size-7 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-background p-0.5"
            >
              <Image src={logo.src} alt={logo.name} width={18} height={18} className="size-[18px] object-contain" />
            </div>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{CERTIFIER_LOGOS.length} certifieurs</span> couverts
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Santé panel content
   ═══════════════════════════════════════════════ */

function SantePanelContent() {
  return (
    <div className="flex flex-col gap-5 max-w-lg w-full">
      {/* Header */}
      <div>
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-leaf/30 bg-leaf/5 px-3 py-1 text-xs font-semibold text-leaf">
          <Heartbeat className="size-3" weight="fill" />
          02 — Tayyib
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground max-w-sm">
          Halal, c&apos;est le minimum.{" "}
          <span className="font-semibold text-foreground">Tayyib, c&apos;est ce que ton corps mérite vraiment</span>
          {" "}— NutriScore, additifs à risque, transformation industrielle. En un scan.
        </p>
      </div>

      {/* ── NaqiyScore Santé — ring hero ── */}
      <div className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/50 max-w-sm">
        {/* Circular ring */}
        <div className="relative shrink-0" style={{ width: HEALTH_RING_SIZE, height: HEALTH_RING_SIZE }}>
          <svg
            width={HEALTH_RING_SIZE}
            height={HEALTH_RING_SIZE}
            viewBox={`0 0 ${HEALTH_RING_SIZE} ${HEALTH_RING_SIZE}`}
            className="-rotate-90"
          >
            <circle
              cx={HEALTH_RING_SIZE / 2}
              cy={HEALTH_RING_SIZE / 2}
              r={HEALTH_RING_R}
              fill="none"
              stroke="currentColor"
              className="text-border/40"
              strokeWidth={HEALTH_RING_STROKE}
            />
            <circle
              cx={HEALTH_RING_SIZE / 2}
              cy={HEALTH_RING_SIZE / 2}
              r={HEALTH_RING_R}
              fill="none"
              stroke={HEALTH_SCORE.color}
              strokeWidth={HEALTH_RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={HEALTH_RING_CIRC}
              strokeDashoffset={HEALTH_RING_CIRC * (1 - HEALTH_SCORE.score / 100)}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0">
            <span className="text-[22px] font-black leading-none" style={{ color: HEALTH_SCORE.color }}>
              {HEALTH_SCORE.score}
            </span>
            <span className="text-[8px] font-semibold text-muted-foreground/50 leading-none -mt-px">/100</span>
          </div>
        </div>
        {/* Label */}
        <div>
          <p className="text-base font-bold uppercase tracking-wide leading-none" style={{ color: HEALTH_SCORE.color }}>
            {HEALTH_SCORE.label}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
            Score Naqiy Santé
          </p>
        </div>
      </div>

      {/* NutriScore strip */}
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">NutriScore</p>
        <div className="inline-flex items-center gap-1.5 rounded-2xl bg-card px-4 py-3 shadow-sm">
          {NUTRI_GRADES.map((g) => {
            const isActive = g.grade === "B";
            return (
              <div
                key={g.grade}
                className="flex items-center justify-center rounded-lg font-black text-white transition-all duration-200"
                style={{
                  backgroundColor: g.color,
                  opacity: isActive ? 1 : 0.2,
                  width: isActive ? 50 : 28,
                  height: isActive ? 30 : 24,
                  fontSize: isActive ? 17 : 13,
                }}
              >
                {g.grade}
              </div>
            );
          })}
          <span className="ml-2 text-sm font-semibold hidden sm:inline" style={{ color: "#85BB2F" }}>
            Bon
          </span>
        </div>
      </div>

      {/* NOVA + Additifs */}
      <div className="grid grid-cols-2 gap-3 max-w-sm">
        {/* NOVA */}
        <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/50">
          <div className="mb-3 flex items-center gap-1.5">
            <Leaf className="size-4 text-leaf" weight="fill" />
            <p className="text-xs font-bold text-foreground">Indice NOVA</p>
          </div>
          <div className="flex items-end gap-1 h-8">
            {NOVA_LEVELS.map((n) => {
              const isActive = n.level === 2;
              const heights = [18, 32, 22, 14];
              return (
                <div
                  key={n.level}
                  className="flex-1 rounded-sm transition-all duration-200"
                  style={{
                    backgroundColor: n.color,
                    opacity: isActive ? 1 : 0.2,
                    height: heights[n.level - 1],
                  }}
                />
              );
            })}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Niveau <span className="font-semibold text-foreground">2</span> — peu transformé
          </p>
        </div>

        {/* Additifs */}
        <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/50">
          <div className="mb-3 flex items-center gap-1.5">
            <Warning className="size-4 text-gold" weight="fill" />
            <p className="text-xs font-bold text-foreground">Additifs</p>
          </div>
          <div className="space-y-2">
            {ADDITIF_STATS.map((cat) => (
              <div key={cat.label} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-[10px] text-muted-foreground leading-none">{cat.label}</span>
                </div>
                <span className="text-[11px] font-semibold text-foreground tabular-nums">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Yuka comparison */}
      <div className="flex items-start gap-3 rounded-2xl border border-leaf/20 bg-leaf/5 px-4 py-3 max-w-sm">
        <CheckCircle className="size-4 shrink-0 text-leaf mt-0.5" weight="fill" />
        <div>
          <p className="text-xs font-bold text-foreground">Plus exhaustif que Yuka. Et gratuit.</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            Halal + NOVA + NutriScore + additifs — tout en un seul scan.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Desktop — horizontal scroll hijack (Apple-style)
   ═══════════════════════════════════════════════ */

function DesktopSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  /* Backgrounds */
  const bgGoldOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const bgLeafOpacity  = useTransform(scrollYProgress, [0.5, 1], [0, 1]);

  /* Scroll hint */
  const hintOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  /*
   * Architecture : deux panels absolute inset-0, synchronisés.
   * Transition pure translateX — swipe iOS.
   * Easing Apple (ease-in-out cubic fort) : lent aux bords → rapide au centre → lent à l'arrivée.
   * Scale subtil : le panel sortant rétrécit légèrement, l'entrant s'agrandit → profondeur iOS.
   */

  // Courbe Apple : ease-in-out cubic fort, signature des transitions iOS/macOS
  const easeApple = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const p1X     = useTransform(scrollYProgress, [0.30, 0.65], ["0%", "-100%"], { ease: easeApple });
  const p2X     = useTransform(scrollYProgress, [0.30, 0.65], ["100%", "0%"],  { ease: easeApple });
  // Scale : sortant se rétracte, entrant s'avance — crée la sensation de profondeur
  const p1Scale = useTransform(scrollYProgress, [0.30, 0.65], [1, 0.96],       { ease: easeApple });
  const p2Scale = useTransform(scrollYProgress, [0.30, 0.65], [0.96, 1],       { ease: easeApple });

  return (
    <div
      ref={containerRef}
      className="relative hidden lg:block"
      style={{ height: "250vh" }}
    >
      <div className="sticky top-0 h-screen overflow-hidden relative">

        {/* Background — gold */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: bgGoldOpacity,
            background: "radial-gradient(ellipse 90% 70% at 25% 50%, oklch(0.76 0.14 88 / 7%) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        {/* Background — leaf */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: bgLeafOpacity,
            background: "radial-gradient(ellipse 90% 70% at 75% 50%, oklch(0.7 0.18 145 / 7%) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        {/* ── TITRE FIXE ── */}
        <div className="absolute top-0 left-0 right-0 z-20 pt-20 px-2 pointer-events-none">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Le NaqiyScore™
          </h2>
        </div>

        {/* ── PANELS — overflow-hidden explicite pour clipper les transitions ── */}
        <div className="absolute inset-0 overflow-hidden">

          {/* Panel 1 — Halal : sort par la gauche */}
          <motion.div
            className="absolute inset-0 flex flex-col justify-center px-2"
            style={{
              paddingTop: "140px",
              paddingBottom: "56px",
              translateX: p1X,
              scale: p1Scale,
              willChange: "transform",
            }}
          >
            <HalalPanelContent />
          </motion.div>

          {/* Panel 2 — Santé : entre par la droite */}
          <motion.div
            className="absolute inset-0 flex flex-col justify-center px-2"
            style={{
              paddingTop: "140px",
              paddingBottom: "56px",
              translateX: p2X,
              scale: p2Scale,
              willChange: "transform",
            }}
          >
            <SantePanelContent />
          </motion.div>

        </div>

        {/* Panel progress indicator */}
        <PanelIndicator progress={scrollYProgress} />

        {/* Scroll hint */}
        <motion.div
          className="absolute right-10 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
          style={{ opacity: hintOpacity }}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 rounded-full bg-background/60 backdrop-blur-sm border border-border/40 px-3 py-1.5 text-xs text-muted-foreground shadow-lg">
              <span>Score Santé</span>
              <ArrowRight className="size-3" />
            </div>
            <motion.div
              animate={{ x: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            >
              <ArrowRight className="size-5 text-muted-foreground/30" />
            </motion.div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Mobile — tab switcher
   ═══════════════════════════════════════════════ */

function MobileSection() {
  const [activeTab, setActiveTab] = useState<"halal" | "sante">("halal");

  return (
    <section className="block lg:hidden relative overflow-hidden py-16">
      {/* Tinted background */}
      <div
        className="pointer-events-none absolute inset-0 transition-all duration-700"
        style={{
          background:
            activeTab === "halal"
              ? "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(0.76 0.14 88 / 5%) 0%, transparent 70%)"
              : "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(0.7 0.18 145 / 5%) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="container max-w-lg">
        {/* Titre statique */}
        <h2 className="font-display text-3xl font-bold tracking-tight mb-6">
          Le NaqiyScore™
        </h2>

        {/* Tab switcher */}
        <div className="mb-8 flex w-full rounded-2xl bg-card p-1 shadow-sm ring-1 ring-border/50">
          <button
            onClick={() => setActiveTab("halal")}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 ${
              activeTab === "halal"
                ? "bg-gold text-black shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="size-3.5" weight="fill" />
              Halal
            </span>
          </button>
          <button
            onClick={() => setActiveTab("sante")}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 ${
              activeTab === "sante"
                ? "bg-leaf text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <Heartbeat className="size-3.5" weight="fill" />
              Santé
            </span>
          </button>
        </div>

        {/* Panel content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {activeTab === "halal" ? <HalalPanelContent /> : <SantePanelContent />}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   Export
   ═══════════════════════════════════════════════ */

export function NaqiyScoreSection() {
  return (
    <>
      <DesktopSection />
      <MobileSection />
    </>
  );
}
