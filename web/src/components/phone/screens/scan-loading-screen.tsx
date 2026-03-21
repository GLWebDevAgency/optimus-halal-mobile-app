"use client";

import React from "react";

const GOLD = "oklch(0.78 0.17 82)";

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={GOLD}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ animation: "step-spin 1s linear infinite" }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

export function ScanLoadingScreen() {
  const circleRadius = 36;
  const circleCircumference = 2 * Math.PI * circleRadius;

  return (
    <div
      className="relative w-full h-full flex flex-col items-center"
      style={{ backgroundColor: "#0f0f0f" }}
    >
      {/* Status bar spacing */}
      <div style={{ height: 44 }} />

      {/* Barcode text */}
      <div className="mt-8 mb-12">
        <span
          className="text-xs tracking-widest"
          style={{ color: "#555", fontFamily: "ui-monospace, monospace" }}
        >
          3017620422003
        </span>
      </div>

      {/* Circular progress */}
      <div className="relative flex items-center justify-center mb-8" style={{ width: 88, height: 88 }}>
        {/* Background circle */}
        <svg width="88" height="88" viewBox="0 0 88 88" className="absolute">
          <circle
            cx="44"
            cy="44"
            r={circleRadius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="4"
          />
        </svg>
        {/* Animated progress circle */}
        <svg
          width="88"
          height="88"
          viewBox="0 0 88 88"
          className="absolute"
          style={{
            animation: "progress-spin 2s linear infinite",
            transformOrigin: "center",
          }}
        >
          <circle
            cx="44"
            cy="44"
            r={circleRadius}
            fill="none"
            stroke={GOLD}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circleCircumference}
            strokeDashoffset={circleCircumference * 0.35}
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "center",
            }}
          />
        </svg>
        {/* Percentage text */}
        <span
          className="text-lg font-bold relative z-10"
          style={{ color: GOLD }}
        >
          67%
        </span>
      </div>

      {/* Status text */}
      <p className="text-white text-base font-medium mb-10">
        Analyse en cours...
      </p>

      {/* Steps list */}
      <div className="flex flex-col gap-4 px-12 w-full">
        {/* Step 1 - completed */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-full flex-shrink-0"
            style={{ width: 24, height: 24, backgroundColor: "rgba(34,197,94,0.15)" }}
          >
            <CheckIcon />
          </div>
          <span className="text-sm text-white">
            Identification du produit
          </span>
        </div>

        {/* Step 2 - completed */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-full flex-shrink-0"
            style={{ width: 24, height: 24, backgroundColor: "rgba(34,197,94,0.15)" }}
          >
            <CheckIcon />
          </div>
          <span className="text-sm text-white">
            Analyse des ingrédients
          </span>
        </div>

        {/* Step 3 - in progress */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-full flex-shrink-0"
            style={{ width: 24, height: 24, backgroundColor: "rgba(202,169,80,0.15)" }}
          >
            <SpinnerIcon />
          </div>
          <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
            Vérification halal...
          </span>
        </div>
      </div>

      {/* Naqiy watermark */}
      <div className="absolute bottom-16 left-0 right-0 flex justify-center">
        <span
          className="text-3xl font-bold select-none"
          style={{ color: GOLD, opacity: 0.03 }}
        >
          naqiy
        </span>
      </div>
    </div>
  );
}
