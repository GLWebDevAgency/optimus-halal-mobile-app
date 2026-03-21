"use client";

import React from "react";

const GOLD = "oklch(0.78 0.17 82)";

function BackArrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

const ingredients = [
  { name: "Sucre", safe: true },
  { name: "Huile de palme", safe: true },
  { name: "Cacao", safe: true },
  { name: "Lait", safe: true },
  { name: "Lécithine de soja", safe: true },
];

export function ScanResultScreen() {
  return (
    <div
      className="relative w-full h-full flex flex-col"
      style={{ backgroundColor: "#0f0f0f" }}
    >
      {/* Status bar padding */}
      <div style={{ height: 44 }} />

      {/* Header */}
      <div className="flex items-center gap-3 px-5 mb-4">
        <div className="flex items-center justify-center" style={{ width: 32, height: 32 }}>
          <BackArrow />
        </div>
        <span className="text-white text-base font-semibold">Résultat</span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {/* Product card */}
        <div
          className="rounded-2xl p-4 flex flex-col items-center gap-2 mb-4"
          style={{ backgroundColor: "#1a1a1a" }}
        >
          <div
            className="flex items-center justify-center rounded-xl"
            style={{
              width: 72,
              height: 72,
              background: "linear-gradient(135deg, #3a2a1a 0%, #2a1a0a 100%)",
            }}
          >
            <span className="text-3xl">🍫</span>
          </div>
          <div className="text-white font-bold text-lg leading-tight">Nutella 400g</div>
          <div className="text-[#888] text-sm">Ferrero</div>
        </div>

        {/* Verdict badge */}
        <div
          className="rounded-2xl p-5 flex flex-col items-center gap-1.5 mb-4"
          style={{
            backgroundColor: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.25)",
          }}
        >
          <span className="text-xl font-bold tracking-wide" style={{ color: "#22c55e" }}>
            HALAL
          </span>
          <span className="text-sm" style={{ color: "#22c55e", opacity: 0.7 }}>
            Score : 87/100
          </span>
        </div>

        {/* Naqiy Grade bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-white text-xs font-semibold">Naqiy Grade</span>
            <span className="text-xs font-bold" style={{ color: GOLD }}>87%</span>
          </div>
          <div
            className="rounded-full overflow-hidden"
            style={{ height: 6, backgroundColor: "#1a1a1a" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: "87%",
                background: `linear-gradient(90deg, ${GOLD}, #b8860b)`,
              }}
            />
          </div>
        </div>

        {/* Ingredients section */}
        <div className="mb-4">
          <span className="text-white text-sm font-semibold block mb-2">Ingrédients</span>
          <div
            className="rounded-2xl divide-y"
            style={{ backgroundColor: "#1a1a1a", borderColor: "rgba(255,255,255,0.05)" }}
          >
            {ingredients.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between px-4 py-2.5"
                style={{ borderColor: "rgba(255,255,255,0.05)" }}
              >
                <span className="text-white text-sm">{item.name}</span>
                <span
                  className="text-sm font-medium"
                  style={{ color: item.safe ? "#22c55e" : "#ef4444" }}
                >
                  {item.safe ? "✓" : "✗"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Madhab badge */}
        <div className="flex justify-center mb-5">
          <div
            className="rounded-full px-3.5 py-1.5 text-xs font-medium"
            style={{
              backgroundColor: `color-mix(in oklch, ${GOLD} 12%, transparent)`,
              color: GOLD,
            }}
          >
            Selon l&apos;école Hanafi
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-2.5">
          <button
            className="w-full rounded-xl py-3 text-sm font-semibold text-center"
            style={{
              border: `1.5px solid rgba(255,255,255,0.15)`,
              color: "white",
              backgroundColor: "transparent",
            }}
          >
            Voir les alternatives
          </button>
          <button
            className="w-full rounded-xl py-3 text-sm font-semibold text-center"
            style={{
              backgroundColor: GOLD,
              color: "#0f0f0f",
            }}
          >
            Ajouter aux favoris
          </button>
        </div>
      </div>
    </div>
  );
}
