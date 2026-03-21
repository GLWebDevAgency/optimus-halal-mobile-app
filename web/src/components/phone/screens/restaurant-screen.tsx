"use client";

import React from "react";

const GOLD = "oklch(0.78 0.17 82)";

function NavigationIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f0f0f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  );
}

const pins = [
  { x: 100, y: 80 },
  { x: 220, y: 60 },
  { x: 160, y: 160 },
  { x: 300, y: 120 },
  { x: 80, y: 200 },
];

function SmallGoldPin({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle cx="0" cy="-5" r="6" fill={GOLD} opacity="0.85" />
      <polygon points="-3,-1 3,-1 0,5" fill={GOLD} opacity="0.85" />
      <circle cx="0" cy="-5" r="2.5" fill="#0f0f0f" />
    </g>
  );
}

function StarRating() {
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} style={{ color: GOLD, fontSize: 13, lineHeight: 1 }}>&#9733;</span>
        ))}
        <span style={{ color: GOLD, fontSize: 13, lineHeight: 1, opacity: 0.4 }}>&#9733;</span>
      </div>
      <span className="text-white text-xs font-semibold ml-0.5">4.5</span>
    </div>
  );
}

export function RestaurantScreen() {
  return (
    <div
      className="relative w-full h-full flex flex-col"
      style={{ backgroundColor: "#e8e8e8" }}
    >
      {/* Abstract map background — top ~45% */}
      <div className="relative" style={{ height: "45%" }}>
        <svg
          viewBox="0 0 375 360"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid slice"
        >
          <rect width="375" height="360" fill="#e8e8e8" />

          {/* Streets horizontal */}
          <rect x="0" y="60" width="375" height="14" fill="#f5f5f5" />
          <rect x="0" y="150" width="375" height="10" fill="#f5f5f5" />
          <rect x="0" y="240" width="375" height="12" fill="#f5f5f5" />
          <rect x="0" y="310" width="375" height="16" fill="#f5f5f5" />

          {/* Streets vertical */}
          <rect x="70" y="0" width="12" fill="#f5f5f5" height="360" />
          <rect x="180" y="0" width="10" fill="#f5f5f5" height="360" />
          <rect x="270" y="0" width="14" fill="#f5f5f5" height="360" />

          {/* Blocks */}
          <rect x="90" y="78" width="85" height="68" rx="4" fill="#ddd" />
          <rect x="195" y="78" width="70" height="68" rx="4" fill="#e0e0e0" />
          <rect x="90" y="165" width="85" height="70" rx="4" fill="#e0e0e0" />
          <rect x="195" y="165" width="70" height="70" rx="4" fill="#ddd" />
          <rect x="290" y="78" width="50" height="68" rx="4" fill="#ddd" />

          {/* Pins */}
          {pins.map((pin, i) => (
            <SmallGoldPin key={i} x={pin.x} y={pin.y} />
          ))}

          {/* Active pin (selected restaurant) — larger, highlighted */}
          <g transform="translate(160, 160)">
            <circle cx="0" cy="-7" r="10" fill={GOLD} />
            <polygon points="-5,-2 5,-2 0,8" fill={GOLD} />
            <circle cx="0" cy="-7" r="4" fill="white" />
          </g>

          {/* User dot */}
          <g transform="translate(200, 240)">
            <circle cx="0" cy="0" r="12" fill="rgba(59,130,246,0.15)">
              <animate attributeName="r" values="10;16;10" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0.08;0.3" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="0" cy="0" r="5.5" fill="white" />
            <circle cx="0" cy="0" r="4" fill="#3b82f6" />
          </g>
        </svg>
      </div>

      {/* Bottomsheet overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 flex flex-col"
        style={{
          height: "58%",
          backgroundColor: "#0f0f0f",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          boxShadow: "0 -8px 40px rgba(0,0,0,0.4)",
        }}
      >
        {/* Drag indicator */}
        <div className="flex justify-center pt-3 pb-3">
          <div className="rounded-full" style={{ width: 40, height: 4, backgroundColor: "#444" }} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-8">
          {/* Restaurant photo placeholder */}
          <div
            className="rounded-xl mb-4 overflow-hidden"
            style={{
              width: "100%",
              height: 120,
              background: "linear-gradient(135deg, #3a3a3a 0%, #2a2a2a 40%, #1a1a1a 100%)",
            }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-3xl opacity-30">🍽️</span>
            </div>
          </div>

          {/* Name */}
          <div className="text-white text-lg font-bold mb-1.5">Istanbul Kebab</div>

          {/* Rating */}
          <div className="mb-2.5">
            <StarRating />
          </div>

          {/* Badge */}
          <div className="flex items-center gap-2 mb-3">
            <div
              className="rounded-full px-2.5 py-1 text-[10px] font-bold"
              style={{
                backgroundColor: "rgba(34,197,94,0.15)",
                color: "#22c55e",
              }}
            >
              Certifié AVS
            </div>
          </div>

          {/* Address */}
          <div className="text-[#888] text-sm mb-1">23 Rue de la Paix, Paris</div>

          {/* Distance */}
          <div className="text-[#888] text-sm mb-2.5">1.2 km</div>

          {/* Hours */}
          <div className="flex items-center gap-1.5 mb-5">
            <div
              className="rounded-full"
              style={{ width: 7, height: 7, backgroundColor: "#22c55e" }}
            />
            <span className="text-sm" style={{ color: "#ccc" }}>
              Ouvert <span style={{ color: "#888" }}>· Ferme à 22h00</span>
            </span>
          </div>

          {/* CTA */}
          <button
            className="w-full rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2"
            style={{
              backgroundColor: GOLD,
              color: "#0f0f0f",
            }}
          >
            <NavigationIcon />
            Itinéraire
          </button>
        </div>
      </div>
    </div>
  );
}
