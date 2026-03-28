"use client";

import React from "react";
import { motion, useTransform } from "motion/react";
import {
  Handshake,
  ShieldWarning,
  Heart,
  ShareNetwork,
  DotsThree,
  ShieldCheck,
  Knife,
  Heartbeat,
  Warning,
  CaretRight,
  Cookie,
  Drop,
  Fire,
  Barbell,
} from "@phosphor-icons/react";
import { useNaqiyScroll } from "@/components/phone/naqiy-scroll-context";

/* ═══════════════════════════════════════════════════════════
   CONSTANTS & DATA — Static mockup matching real mobile app
   ═══════════════════════════════════════════════════════════ */

const GREEN = "#22c55e";
const RED = "#ef4444";
const ORANGE = "#f97316";
const GOLD = "#D4AF37";
const YELLOW = "#FECB02";
const BG = "#0C0C0C";
const CARD = "#1A1A1A";
const BORDER = "rgba(255,255,255,0.06)";
const MUTED = "rgba(255,255,255,0.4)";

/* ── Product ── */
const PRODUCT = {
  name: "Cordon Bleu Halal",
  brand: "Marque Y",
  barcode: "3266980026417",
};

/* ── Certifier ── */
const CERTIFIER = {
  name: "Certifieur X",
  score: 2,
  label: "Pas fiable du tout",
  color: RED,
};

/* ── NaqiyGrade strip ── */
const TRUST_GRADES = [
  { grade: 1, arabic: "\u0661", color: "#22c55e" },
  { grade: 2, arabic: "\u0662", color: "#84cc16" },
  { grade: 3, arabic: "\u0663", color: "#f59e0b" },
  { grade: 4, arabic: "\u0664", color: "#f97316" },
  { grade: 5, arabic: "\u0665", color: "#ef4444" },
];
const ACTIVE_GRADE = 5;

/* ── Madhab data ── */
const MADHABS = [
  { name: "Hanafi", verdict: "halal" as const, score: 85 },
  { name: "Shafii", verdict: "halal" as const, score: 79 },
  { name: "Maliki", verdict: "halal" as const, score: 78 },
  { name: "Hanbali", verdict: "halal" as const, score: 82 },
];

const VERDICT_COLORS: Record<string, string> = {
  halal: GREEN,
  doubtful: ORANGE,
  haram: RED,
  unknown: "#6b7280",
};

const VERDICT_LABELS: Record<string, string> = {
  halal: "Halal",
  doubtful: "Douteux",
  haram: "Haram",
  unknown: "Inconnu",
};

/* ── Ingredients ── */
const INGREDIENTS = [
  { name: "Viande de poulet", status: "halal" as const },
  { name: "Chapelure (gluten)", status: "halal" as const },
  { name: "Arome naturel", status: "halal" as const },
];

/* ── Health ── */
const HEALTH = {
  score: 68,
  label: "BON",
  color: GREEN,
};

const NUTRI_GRADES = [
  { letter: "A", color: "#038141", active: false },
  { letter: "B", color: "#85BB2F", active: false },
  { letter: "C", color: YELLOW, active: true },
  { letter: "D", color: "#EE8100", active: false },
  { letter: "E", color: "#E63E11", active: false },
];

const HEALTH_AXES = [
  { label: "Nutrition", score: 62, max: 100, color: ORANGE },
  { label: "Additifs", score: 85, max: 100, color: GREEN },
];

const NUTRIENTS = [
  { label: "Energie", value: "1120 kJ", icon: Fire },
  { label: "Lipides", value: "14.2g", icon: Drop },
  { label: "Glucides", value: "18.5g", icon: Cookie },
  { label: "Proteines", value: "11.8g", icon: Barbell },
];

/* ── Apple ease ── */
const easeApple = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/* ═══════════════════════════════════════════════════════════
   SVG COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function MadhabRing({
  name,
  verdict,
  score,
}: {
  name: string;
  verdict: "halal" | "doubtful" | "haram" | "unknown";
  score: number;
}) {
  const size = 42;
  const strokeWidth = 3;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color = VERDICT_COLORS[verdict];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 72, gap: 4 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {verdict === "halal" ? (
            <Handshake size={16} weight="fill" color={color} />
          ) : (
            <ShieldWarning size={16} weight="fill" color={color} />
          )}
        </div>
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.7)", textAlign: "center" }}>
        {name}
      </span>
      <span
        style={{
          fontSize: 8,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          color,
          backgroundColor: `${color}15`,
          padding: "1px 5px",
          borderRadius: 4,
        }}
      >
        {VERDICT_LABELS[verdict]}
      </span>
    </div>
  );
}

function HealthRing() {
  const size = 60;
  const strokeWidth = 5;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - HEALTH.score / 100);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={HEALTH.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 800, color: HEALTH.color, lineHeight: 1 }}>
          {HEALTH.score}
        </span>
        <span style={{ fontSize: 8, color: MUTED }}>/100</span>
      </div>
    </div>
  );
}

function NaqiyGradeStrip() {
  const activeGrade = TRUST_GRADES.find((g) => g.grade === ACTIVE_GRADE)!;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      <span style={{ fontSize: 10, fontWeight: 900, color: GOLD, marginRight: 1 }}>N</span>
      {TRUST_GRADES.map((g) => {
        const isActive = g.grade === ACTIVE_GRADE;
        return (
          <div
            key={g.grade}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 4,
              backgroundColor: g.color,
              opacity: isActive ? 1 : 0.2,
              width: isActive ? 32 : 16,
              height: isActive ? 20 : 16,
              fontSize: isActive ? 11 : 8,
              fontWeight: 900,
              color: "white",
            }}
          >
            {g.arabic}
          </div>
        );
      })}
      <span style={{ fontSize: 9, fontWeight: 600, color: activeGrade.color, marginLeft: 4 }}>
        {CERTIFIER.label}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB CONTENT PANELS
   ═══════════════════════════════════════════════════════════ */

function HalalTabContent() {
  return (
    <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
      {/* ── Madhab Rings ── */}
      <div
        style={{
          borderRadius: 14,
          backgroundColor: CARD,
          border: `1px solid ${BORDER}`,
          padding: 14,
        }}
      >
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: GOLD, marginBottom: 10 }}>
          Avis des ecoles - composition du produit
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {MADHABS.map((m) => (
            <MadhabRing key={m.name} name={m.name} verdict={m.verdict} score={m.score} />
          ))}
        </div>
      </div>

      {/* ── Certifier ── */}
      <div
        style={{
          borderRadius: 14,
          backgroundColor: CARD,
          border: `1px solid ${BORDER}`,
          padding: 14,
        }}
      >
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: GOLD, marginBottom: 10 }}>
          Certification - Score de fiabilité certifieur
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: "rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShieldCheck size={18} weight="fill" color={MUTED} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{CERTIFIER.name}</div>
            <div style={{ fontSize: 10, color: MUTED }}>Organisme certifieur</div>
          </div>
          <div
            style={{
              padding: "3px 8px",
              borderRadius: 6,
              backgroundColor: `${CERTIFIER.color}15`,
              border: `1px solid ${CERTIFIER.color}30`,
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 700, color: CERTIFIER.color }}>
              {CERTIFIER.score}/100
            </span>
          </div>
        </div>
        <NaqiyGradeStrip />
      </div>

      {/* ── Ingredients ── */}
      <div
        style={{
          borderRadius: 14,
          backgroundColor: CARD,
          border: `1px solid ${BORDER}`,
          padding: 14,
        }}
      >
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: GOLD, marginBottom: 10 }}>
          Ingredients analyses
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {INGREDIENTS.map((ing) => {
            const color = VERDICT_COLORS[ing.status];
            return (
              <div
                key={ing.name}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                  {ing.name}
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, color }}>
                  {VERDICT_LABELS[ing.status]}
                </span>
                <CaretRight size={10} color={MUTED} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SanteTabContent() {
  return (
    <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
      {/* ── Health Score ── */}
      <div
        style={{
          borderRadius: 14,
          backgroundColor: CARD,
          border: `1px solid ${BORDER}`,
          padding: 14,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <HealthRing />
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: HEALTH.color, textTransform: "uppercase", letterSpacing: 1 }}>
            {HEALTH.label}
          </div>
          <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>Score Naqiy Sante</div>
        </div>
      </div>

      {/* ── NutriScore ── */}
      <div
        style={{
          borderRadius: 14,
          backgroundColor: CARD,
          border: `1px solid ${BORDER}`,
          padding: 14,
        }}
      >
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: GOLD, marginBottom: 10 }}>
          NutriScore
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          {NUTRI_GRADES.map((g) => (
            <div
              key={g.letter}
              style={{
                flex: 1,
                height: g.active ? 28 : 22,
                borderRadius: 6,
                backgroundColor: g.color,
                opacity: g.active ? 1 : 0.3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                alignSelf: "center",
                transition: "all 0.2s",
              }}
            >
              <span
                style={{
                  fontSize: g.active ? 14 : 10,
                  fontWeight: 800,
                  color: "white",
                }}
              >
                {g.letter}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Health Axes ── */}
      <div
        style={{
          borderRadius: 14,
          backgroundColor: CARD,
          border: `1px solid ${BORDER}`,
          padding: 14,
        }}
      >
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: GOLD, marginBottom: 10 }}>
          Axes de sante
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {HEALTH_AXES.map((axis) => (
            <div key={axis.label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{axis.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: axis.color }}>
                  {axis.score}/{axis.max}
                </span>
              </div>
              <div style={{ height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.06)" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${(axis.score / axis.max) * 100}%`,
                    borderRadius: 2,
                    backgroundColor: axis.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Nutrient Grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 6,
        }}
      >
        {NUTRIENTS.map((n) => {
          const Icon = n.icon;
          return (
            <div
              key={n.label}
              style={{
                borderRadius: 12,
                backgroundColor: CARD,
                border: `1px solid ${BORDER}`,
                padding: "10px 12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                <Icon size={10} color={MUTED} />
                <span style={{ fontSize: 9, color: MUTED }}>{n.label}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{n.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function ScanResultScreen() {
  const { scrollYProgress } = useNaqiyScroll();

  /* ── Synchronized tab transition (same range & easing as NaqiyScore panels) ── */
  const halalX = useTransform(scrollYProgress, [0.30, 0.65], ["0%", "-100%"], { ease: easeApple });
  const santeX = useTransform(scrollYProgress, [0.30, 0.65], ["100%", "0%"], { ease: easeApple });
  const indicatorX = useTransform(scrollYProgress, [0.30, 0.65], ["0%", "100%"], { ease: easeApple });

  /* Tab text opacity */
  const halalTabOpacity = useTransform(scrollYProgress, [0.30, 0.65], [1, 0.4], { ease: easeApple });
  const santeTabOpacity = useTransform(scrollYProgress, [0.30, 0.65], [0.4, 1], { ease: easeApple });

  return (
    <div className="relative w-full h-full flex flex-col" style={{ backgroundColor: BG }}>
      {/* ── Verdict Hero ── */}
      <div
        style={{
          background: `linear-gradient(180deg, #0a0a0a 0%, ${BG} 100%)`,
          paddingTop: 52,
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: 10,
          flexShrink: 0,
        }}
      >
        {/* Micro label */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 4,
              background: `linear-gradient(135deg, ${GOLD}, ${GOLD}80)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 7, fontWeight: 900, color: "white" }}>N</span>
          </div>
          <span style={{ fontSize: 9, fontWeight: 600, color: MUTED, letterSpacing: 1, textTransform: "uppercase" }}>
            Naqiy Scan
          </span>
        </div>

        {/* Product row */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {/* Product image placeholder */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              border: `2px solid ${ORANGE}`,
              backgroundColor: "rgba(255,255,255,0.04)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Knife size={24} weight="duotone" color={MUTED} />
          </div>

          {/* Product info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "white",
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {PRODUCT.name}
            </div>
            <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>
              {PRODUCT.brand} · {PRODUCT.barcode}
            </div>
          </div>
        </div>

        {/* Verdict pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            marginTop: 8,
            padding: "4px 10px",
            borderRadius: 20,
            backgroundColor: `${ORANGE}15`,
            border: `1px solid ${ORANGE}25`,
          }}
        >
          <Warning size={11} weight="fill" color={ORANGE} />
          <span style={{ fontSize: 10, fontWeight: 600, color: ORANGE }}>
            Certification Detectee
          </span>
        </div>
      </div>

      {/* ── Tab Bar — scroll-synchronized indicator ── */}
      <div
        style={{
          display: "flex",
          position: "relative",
          borderBottom: `1px solid ${BORDER}`,
          flexShrink: 0,
          backgroundColor: BG,
        }}
      >
        <motion.div
          style={{
            flex: 1,
            padding: "10px 0",
            fontSize: 12,
            fontWeight: 700,
            textAlign: "center",
            opacity: halalTabOpacity,
            color: GOLD,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <Knife size={12} weight="fill" />
          Halal
        </motion.div>
        <motion.div
          style={{
            flex: 1,
            padding: "10px 0",
            fontSize: 12,
            fontWeight: 700,
            textAlign: "center",
            opacity: santeTabOpacity,
            color: GOLD,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <Heartbeat size={12} weight="fill" />
          Sante
        </motion.div>

        {/* Gold animated indicator */}
        <motion.div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "50%",
            height: 2,
            backgroundColor: GOLD,
            translateX: indicatorX,
          }}
        />
      </div>

      {/* ── Tab Content — synchronized horizontal slide ── */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {/* Halal panel */}
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            overflowY: "auto",
            translateX: halalX,
            willChange: "transform",
          }}
        >
          <HalalTabContent />
          {/* Bottom spacer for action bar */}
          <div style={{ height: 80 }} />
        </motion.div>

        {/* Sante panel */}
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            overflowY: "auto",
            translateX: santeX,
            willChange: "transform",
          }}
        >
          <SanteTabContent />
          <div style={{ height: 80 }} />
        </motion.div>
      </div>

      {/* ── Bottom Action Bar ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "rgba(12,12,12,0.88)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderTop: `1px solid ${BORDER}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          paddingTop: 8,
          paddingBottom: 28,
        }}
      >
        {[
          <Heart key="heart" size={18} weight="regular" color="rgba(255,255,255,0.5)" />,
          <ShareNetwork key="share" size={18} weight="regular" color="rgba(255,255,255,0.5)" />,
          <DotsThree key="dots" size={18} weight="bold" color="rgba(255,255,255,0.5)" />,
        ].map((icon, i) => (
          <div
            key={i}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: "rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </div>
        ))}
      </div>
    </div>
  );
}
