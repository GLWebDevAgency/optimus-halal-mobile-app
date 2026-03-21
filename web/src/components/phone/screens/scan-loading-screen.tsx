"use client";

import React from "react";

const GOLD = "#D4AF37";
const GREEN = "#22c55e";

/* ── Icons ─────────────────────────────────────────────── */

function QrIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="8" height="8" rx="1" />
      <rect x="14" y="2" width="8" height="8" rx="1" />
      <rect x="2" y="14" width="8" height="8" rx="1" />
      <path d="M14 14h2v2h-2z" />
      <path d="M20 14h2v2h-2z" />
      <path d="M14 20h2v2h-2z" />
      <path d="M20 20h2v2h-2z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function PackageIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16.5 9.4-9-5.19" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" y1="22" x2="12" y2="12" />
    </svg>
  );
}

function FlaskIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6" />
      <path d="M10 9V3" />
      <path d="M14 9V3" />
      <path d="M7.5 21h9" />
      <path d="M5.2 16.64 10 9h4l4.8 7.64a2 2 0 0 1-1.7 3.36H6.9a2 2 0 0 1-1.7-3.36z" />
    </svg>
  );
}

function ShieldIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function ScaleIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" />
      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" />
      <path d="M7 21h10" />
      <path d="M12 3v18" />
      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
    </svg>
  );
}

/* ── Step data ─────────────────────────────────────────── */

type StepStatus = "completed" | "active" | "pending";

interface Step {
  label: string;
  icon: (color: string) => React.ReactNode;
  status: StepStatus;
}

const steps: Step[] = [
  { label: "Identification du produit", icon: (c) => <PackageIcon color={c} />, status: "completed" },
  { label: "Analyse des ingrédients", icon: (c) => <FlaskIcon color={c} />, status: "completed" },
  { label: "Vérification halal", icon: (c) => <ShieldIcon color={c} />, status: "active" },
  { label: "Évaluation par école", icon: (c) => <ScaleIcon color={c} />, status: "pending" },
];

const madhabs = ["Hanafi", "Shafi'i", "Maliki", "Hanbali"];

/* ── Keyframes injected once ───────────────────────────── */

const keyframes = `
@keyframes pulse-gold {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.08); }
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
`;

/* ── StepNode ──────────────────────────────────────────── */

function StepNode({ step, index }: { step: Step; index: number }) {
  const isLast = index === steps.length - 1;

  const nodeStyle: React.CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: "50%",
    borderWidth: 1.5,
    borderStyle: "solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    position: "relative",
    zIndex: 2,
  };

  const lineStyle: React.CSSProperties = {
    width: 2,
    height: 22,
    borderRadius: 1,
    marginLeft: 13, // center under 28px node
  };

  let iconColor: string;

  if (step.status === "completed") {
    Object.assign(nodeStyle, {
      backgroundColor: GREEN,
      borderColor: GREEN,
    });
    Object.assign(lineStyle, {
      backgroundColor: "rgba(34,197,94,0.5)",
    });
    iconColor = "white";
  } else if (step.status === "active") {
    Object.assign(nodeStyle, {
      backgroundColor: "transparent",
      borderColor: GOLD,
    });
    Object.assign(lineStyle, {
      backgroundColor: "rgba(255,255,255,0.05)",
    });
    iconColor = GOLD;
  } else {
    Object.assign(nodeStyle, {
      backgroundColor: "transparent",
      borderColor: "rgba(255,255,255,0.12)",
      transform: "scale(0.85)",
    });
    Object.assign(lineStyle, {
      backgroundColor: "rgba(255,255,255,0.05)",
    });
    iconColor = "rgba(255,255,255,0.25)";
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: step.status === "active" ? 700 : 500,
    color:
      step.status === "completed"
        ? "rgba(255,255,255,0.6)"
        : step.status === "active"
          ? GOLD
          : "rgba(255,255,255,0.2)",
    lineHeight: "28px",
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {/* Node + glow ring */}
        <div style={{ position: "relative", width: 28, height: 28, flexShrink: 0 }}>
          {step.status === "active" && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 36,
                height: 36,
                borderRadius: "50%",
                backgroundColor: "rgba(212,175,55,0.12)",
                border: "1px solid rgba(212,175,55,0.19)",
                transform: "translate(-50%, -50%)",
                animation: "pulse-gold 2s ease-in-out infinite",
              }}
            />
          )}
          <div style={nodeStyle}>
            {step.status === "completed" ? <CheckIcon /> : step.icon(iconColor)}
          </div>
        </div>

        {/* Label */}
        <div style={{ flex: 1 }}>
          <span style={labelStyle}>{step.label}</span>
          {/* Madhab chips under step 4 */}
          {index === 3 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {madhabs.map((m) => (
                <span
                  key={m}
                  style={{
                    padding: "3px 8px",
                    borderRadius: 8,
                    backgroundColor: "rgba(212,175,55,0.09)",
                    border: "1px solid rgba(212,175,55,0.15)",
                    color: GOLD,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                  }}
                >
                  {m}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Connecting line */}
      {!isLast && <div style={lineStyle} />}
    </div>
  );
}

/* ── Shimmer card ──────────────────────────────────────── */

function ShimmerCard({ height }: { height: number }) {
  return (
    <div
      style={{
        height,
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.04)",
        backgroundImage:
          "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0) 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.8s ease-in-out infinite",
      }}
    />
  );
}

/* ── Main component ────────────────────────────────────── */

export function ScanLoadingScreen() {
  return (
    <div className="relative w-full h-full flex flex-col" style={{ backgroundColor: "#0a1a10" }}>
      <style>{keyframes}</style>

      {/* ── Hero Section (top ~50%) ── */}
      <div
        style={{
          background: "linear-gradient(180deg, #0a1a10 0%, #0f2418 40%, #132a1a 100%)",
          paddingTop: 48,
          paddingLeft: 24,
          paddingRight: 24,
          paddingBottom: 24,
          flex: "0 0 auto",
        }}
      >
        {/* Barcode chip */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: 8,
              backgroundColor: "rgba(255,255,255,0.06)",
            }}
          >
            <QrIcon />
            <span
              style={{
                fontFamily: "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace",
                fontSize: 12,
                color: "rgba(255,255,255,0.4)",
              }}
            >
              3017620422003
            </span>
          </div>
        </div>

        {/* Stepper timeline */}
        <div style={{ paddingLeft: 12, display: "flex", flexDirection: "column", gap: 4 }}>
          {steps.map((step, i) => (
            <StepNode key={step.label} step={step} index={i} />
          ))}
        </div>
      </div>

      {/* ── Skeleton Cards (below hero) ── */}
      <div
        style={{
          flex: 1,
          backgroundColor: "#0f0f0f",
          paddingLeft: 24,
          paddingRight: 24,
          paddingTop: 24,
        }}
      >
        <ShimmerCard height={80} />
        <div style={{ marginTop: 12 }}>
          <ShimmerCard height={60} />
        </div>
      </div>
    </div>
  );
}
