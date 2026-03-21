"use client";

import React from "react";
import { BottomTabBar } from "./home-screen";

const GOLD = "#D4AF37";

/* ─── Icons ─── */

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

/* ─── Data ─── */

const pins = [
  { x: 95, y: 130 },
  { x: 210, y: 90 },
  { x: 155, y: 240 },
  { x: 295, y: 170 },
  { x: 75, y: 340 },
  { x: 265, y: 310 },
];

const filters = [
  { label: "Tous", active: true },
  { label: "AVS", active: false },
  { label: "Achahada", active: false },
  { label: "Halal Correct", active: false },
  { label: "Ouvert", active: false },
];

const storeCards = [
  {
    name: "Istanbul Kebab",
    type: "Restaurant",
    certifier: "AVS",
    distance: "1.2 km",
    rating: "4.5",
    open: true,
  },
  {
    name: "Boucherie Al-Baraka",
    type: "Boucherie",
    certifier: "Achahada",
    distance: "0.8 km",
    rating: "4.7",
    open: true,
  },
];

/* ─── Sub-components ─── */

function GoldPin({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle cx="0" cy="-7" r="9" fill={GOLD} opacity="0.9" />
      <polygon points="-4.5,-2 4.5,-2 0,7" fill={GOLD} opacity="0.9" />
      <circle cx="0" cy="-7" r="3.5" fill="#1a1a1a" />
    </g>
  );
}

function UserDot() {
  return (
    <g transform="translate(187, 280)">
      <circle cx="0" cy="0" r="12" fill="rgba(59,130,246,0.18)">
        <animate attributeName="r" values="12;20;12" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0.08;0.3" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="0" cy="0" r="6" fill="white" />
      <circle cx="0" cy="0" r="5" fill="#3b82f6" />
    </g>
  );
}

function StoreCard({ store }: { store: typeof storeCards[number] }) {
  return (
    <div
      className="flex-shrink-0 flex flex-col gap-1.5"
      style={{
        width: 200,
        borderRadius: 12,
        backgroundColor: "rgba(18,18,18,0.9)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.06)",
        padding: 12,
      }}
    >
      <div className="text-white text-sm font-bold leading-tight">{store.name}</div>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
        {store.type} · {store.certifier}
      </div>
      <div style={{ color: GOLD, fontSize: 11, fontWeight: 600 }}>{store.distance}</div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div
            className="rounded-full"
            style={{
              width: 6,
              height: 6,
              backgroundColor: store.open ? "#22c55e" : "#ef4444",
            }}
          />
          <span style={{ fontSize: 11, color: store.open ? "#22c55e" : "#ef4444" }}>
            {store.open ? "Ouvert" : "Fermé"}
          </span>
        </div>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
          {store.rating} ⭐
        </span>
      </div>
    </div>
  );
}

/* ─── MapScreen ─── */

export function MapScreen() {
  return (
    <div className="relative w-full h-full flex flex-col" style={{ backgroundColor: "#1a1a1a" }}>
      {/* Status bar padding */}
      <div style={{ height: 44 }} />

      {/* Search bar overlay */}
      <div className="absolute top-[52px] left-4 right-4 z-10">
        <div
          className="flex items-center gap-2.5 rounded-xl"
          style={{
            height: 44,
            padding: "0 16px",
            backgroundColor: "rgba(18,18,18,0.9)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <SearchIcon />
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, flex: 1 }}>
            Rechercher un magasin...
          </span>
        </div>
      </div>

      {/* Filter pills overlay */}
      <div className="absolute top-[104px] left-0 right-0 z-10" style={{ padding: "0 16px" }}>
        <div className="flex gap-2 overflow-x-hidden">
          {filters.map((f) => (
            <div
              key={f.label}
              className="rounded-full whitespace-nowrap"
              style={{
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 500,
                backgroundColor: f.active ? GOLD : "rgba(255,255,255,0.06)",
                color: f.active ? "#0f0f0f" : "rgba(255,255,255,0.5)",
                border: f.active ? "none" : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {f.label}
            </div>
          ))}
        </div>
      </div>

      {/* Abstract dark map */}
      <div className="flex-1 relative">
        <svg
          viewBox="0 0 375 680"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Dark background */}
          <rect width="375" height="680" fill="#1a1a1a" />

          {/* Grid pattern — horizontal roads */}
          <rect x="0" y="80" width="375" height="1" fill="rgba(255,255,255,0.05)" />
          <rect x="0" y="140" width="375" height="1.5" fill="rgba(255,255,255,0.04)" />
          <rect x="0" y="200" width="375" height="1" fill="rgba(255,255,255,0.05)" />
          <rect x="0" y="270" width="375" height="1.5" fill="rgba(255,255,255,0.04)" />
          <rect x="0" y="340" width="375" height="1" fill="rgba(255,255,255,0.05)" />
          <rect x="0" y="410" width="375" height="1.5" fill="rgba(255,255,255,0.04)" />
          <rect x="0" y="490" width="375" height="1" fill="rgba(255,255,255,0.05)" />
          <rect x="0" y="560" width="375" height="1.5" fill="rgba(255,255,255,0.04)" />

          {/* Grid pattern — vertical roads */}
          <rect x="50" y="0" width="1" fill="rgba(255,255,255,0.05)" height="680" />
          <rect x="120" y="0" width="1.5" fill="rgba(255,255,255,0.04)" height="680" />
          <rect x="190" y="0" width="1" fill="rgba(255,255,255,0.05)" height="680" />
          <rect x="260" y="0" width="1.5" fill="rgba(255,255,255,0.04)" height="680" />
          <rect x="330" y="0" width="1" fill="rgba(255,255,255,0.05)" height="680" />

          {/* Diagonal roads for realism */}
          <line x1="0" y1="180" x2="200" y2="400" stroke="rgba(255,255,255,0.03)" strokeWidth="1.5" />
          <line x1="150" y1="0" x2="375" y2="300" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

          {/* Block shapes (subtle dark rectangles) */}
          <rect x="55" y="85" width="60" height="50" rx="3" fill="rgba(255,255,255,0.02)" />
          <rect x="125" y="85" width="60" height="50" rx="3" fill="rgba(255,255,255,0.025)" />
          <rect x="195" y="145" width="60" height="50" rx="3" fill="rgba(255,255,255,0.02)" />
          <rect x="265" y="85" width="60" height="120" rx="3" fill="rgba(255,255,255,0.018)" />
          <rect x="55" y="205" width="60" height="60" rx="3" fill="rgba(255,255,255,0.025)" />
          <rect x="125" y="275" width="60" height="60" rx="3" fill="rgba(255,255,255,0.02)" />
          <rect x="195" y="345" width="60" height="60" rx="3" fill="rgba(255,255,255,0.025)" />
          <rect x="55" y="345" width="60" height="60" rx="3" fill="rgba(255,255,255,0.02)" />
          <rect x="265" y="275" width="60" height="60" rx="3" fill="rgba(255,255,255,0.018)" />
          <rect x="265" y="415" width="60" height="70" rx="3" fill="rgba(255,255,255,0.02)" />
          <rect x="125" y="415" width="60" height="70" rx="3" fill="rgba(255,255,255,0.025)" />

          {/* Gold pins */}
          {pins.map((pin, i) => (
            <GoldPin key={i} x={pin.x} y={pin.y} />
          ))}

          {/* User position */}
          <UserDot />
        </svg>
      </div>

      {/* Store Cards Carousel — absolute bottom above tab bar */}
      <div
        className="absolute left-0 right-0 z-10 flex gap-3 overflow-x-hidden"
        style={{ bottom: 80, padding: "0 16px" }}
      >
        {storeCards.map((store) => (
          <StoreCard key={store.name} store={store} />
        ))}
      </div>

      {/* Bottom tab bar */}
      <BottomTabBar activeTab="carte" />
    </div>
  );
}
