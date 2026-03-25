"use client";

import React from "react";

const GREEN = "#22c55e";
const GOLD = "#D4AF37";

/* ── NaqiyGradeBadge strip — exact replica of mobile NaqiyGradeBadge "strip" variant ── */

const TRUST_GRADES = [
  { grade: 1, arabic: "١", color: "#22c55e" },
  { grade: 2, arabic: "٢", color: "#84cc16" },
  { grade: 3, arabic: "٣", color: "#f59e0b" },
  { grade: 4, arabic: "٤", color: "#f97316" },
  { grade: 5, arabic: "٥", color: "#ef4444" },
];

const ACTIVE_GRADE = 1;

function NaqiyGradeStrip() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 6 }}>
      {/* Gold "N" prefix */}
      <span
        style={{
          fontSize: 11,
          fontWeight: 900,
          color: GOLD,
          marginRight: 2,
        }}
      >
        N
      </span>

      {/* 5 grade pills — Arabic numerals */}
      {TRUST_GRADES.map((g) => {
        const isActive = g.grade === ACTIVE_GRADE;
        return (
          <div
            key={g.grade}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 6,
              backgroundColor: g.color,
              opacity: isActive ? 1 : 0.2,
              width: isActive ? 40 : 20,
              height: isActive ? 24 : 20,
              fontSize: isActive ? 13 : 9,
              fontWeight: 900,
              color: "white",
            }}
          >
            {g.arabic}
          </div>
        );
      })}

      {/* Active label */}
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: GREEN,
          marginLeft: 6,
        }}
      >
        Très fiable
      </span>
    </div>
  );
}

/* ── Icons ─────────────────────────────────────────────── */

function NaqiyLogo() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function MagnifyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  );
}

function CheckCircle() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ── Score ring SVG ────────────────────────────────────── */

function ScoreRing({ score }: { score: number }) {
  const r = 27;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);

  return (
    <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={GREEN}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
        />
      </svg>
      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: 700,
          fontSize: 18,
        }}
      >
        87
      </span>
    </div>
  );
}

/* ── Tabs — real app has "Halal" | "Santé" (NOT madhab tabs) ── */

const tabs = ["Halal", "Santé"];
const activeTab = "Halal";

/* ── Ingredient data ───────────────────────────────────── */

const ingredients = [
  { name: "Lécithine de soja", halal: true, note: "Halal" },
  { name: "Arôme vanilline", halal: true, note: "Halal" },
  { name: "Huile de palme", halal: true, note: "Halal" },
];

/* ── Nutrition data ────────────────────────────────────── */

const nutrients = [
  { label: "Énergie", value: "2252 kJ" },
  { label: "Lipides", value: "30.9g" },
  { label: "Glucides", value: "57.5g" },
  { label: "Protéines", value: "6.3g" },
];

/* ── Main component ────────────────────────────────────── */

export function ScanResultScreen() {
  return (
    <div className="relative w-full h-full flex flex-col" style={{ backgroundColor: "#111f15" }}>
      {/* ── Verdict Hero ── */}
      <div
        style={{
          background: "linear-gradient(180deg, #0a1a10 0%, #0f1e14 50%, #111f15 100%)",
          paddingTop: 48,
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: 12,
          flexShrink: 0,
        }}
      >
        {/* Two-column layout */}
        <div style={{ display: "flex", gap: 0 }}>
          {/* LEFT: Product image card */}
          <div style={{ width: "40%", flexShrink: 0 }}>
            <div
              style={{
                position: "relative",
                borderRadius: 16,
                border: `2px solid ${GREEN}`,
                backgroundColor: "rgba(255,255,255,0.06)",
                aspectRatio: "3/4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 36 }}>🍫</span>
                <span
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.3)",
                    fontWeight: 600,
                  }}
                >
                  Nutella
                </span>
              </div>

              {/* Zoom badge */}
              <div
                style={{
                  position: "absolute",
                  bottom: 8,
                  right: 8,
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MagnifyIcon />
              </div>
            </div>
          </div>

          {/* RIGHT: Info stack */}
          <div style={{ flex: 1, paddingLeft: 12, display: "flex", flexDirection: "column", justifyContent: "center", gap: 2 }}>
            {/* Micro row */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <NaqiyLogo />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                NAQIY SCAN
              </span>
            </div>

            {/* Product name */}
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "white",
                lineHeight: 1.3,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              Nutella 400g
            </div>

            {/* Brand + barcode */}
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              Ferrero · 3017620422003
            </div>

            {/* NaqiyGradeBadge strip — replaces plain "HALAL" + score */}
            <NaqiyGradeStrip />
          </div>
        </div>
      </div>

      {/* ── Alert Strip ── */}
      <div style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: 8 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: 20,
            backgroundColor: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.15)",
          }}
        >
          <ShieldCheckIcon />
          <span style={{ fontSize: 12, color: GREEN, fontWeight: 500 }}>
            Composition conforme
          </span>
        </div>
      </div>

      {/* ── Halal / Santé Tabs — real app tabs ── */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
          position: "relative",
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <div
              key={tab}
              style={{
                flex: 1,
                padding: "10px 0",
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? GOLD : "rgba(255,255,255,0.35)",
                textAlign: "center",
                whiteSpace: "nowrap",
              }}
            >
              {tab}
            </div>
          );
        })}
        {/* Gold animated indicator under active tab */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "50%",
            height: 2,
            backgroundColor: GOLD,
          }}
        />
      </div>

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 120 }}>
        {/* Halal Verdict Card */}
        <div
          style={{
            margin: "12px 16px",
            borderRadius: 16,
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
            padding: 16,
          }}
        >
          {/* Score ring + label */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <ScoreRing score={87} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 2 }}>
                Halal
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                Tous les ingrédients conformes
              </div>
            </div>
          </div>

          {/* Ingredient list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ingredients.map((ing) => (
              <div
                key={ing.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <CheckCircle />
                <span style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                  {ing.name}
                </span>
                <span style={{ fontSize: 11, color: GREEN, fontWeight: 500 }}>
                  {ing.note}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Health Card — Santé & Nutrition */}
        <div
          style={{
            margin: "0 16px 16px",
            borderRadius: 16,
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
            padding: 16,
          }}
        >
          {/* Header */}
          <div style={{ fontSize: 14, fontWeight: 700, color: GOLD, marginBottom: 12 }}>
            Santé &amp; Nutrition
          </div>

          {/* NutriScore + NOVA row */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            {/* NutriScore circle */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                backgroundColor: "#E67E22",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>D</span>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>NutriScore</div>
              <div style={{ fontSize: 13, color: "white", fontWeight: 600 }}>D</div>
            </div>

            <div style={{ width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.08)", marginLeft: 4, marginRight: 4 }} />

            {/* NOVA badge */}
            <div
              style={{
                padding: "4px 10px",
                borderRadius: 8,
                backgroundColor: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>Groupe 4</span>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>NOVA</div>
              <div style={{ fontSize: 13, color: "white", fontWeight: 600 }}>Ultra-transformé</div>
            </div>
          </div>

          {/* 2-column nutrient grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            {nutrients.map((n) => (
              <div
                key={n.label}
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  backgroundColor: "rgba(255,255,255,0.03)",
                }}
              >
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>
                  {n.label}
                </div>
                <div style={{ fontSize: 13, color: "white", fontWeight: 600 }}>
                  {n.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Action Bar ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "rgba(18,18,18,0.9)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          paddingTop: 10,
          paddingBottom: 28,
        }}
      >
        {[<HeartIcon key="heart" />, <ShareIcon key="share" />, <DotsIcon key="dots" />].map(
          (icon, i) => (
            <div
              key={i}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: "rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {icon}
            </div>
          ),
        )}
      </div>
    </div>
  );
}
