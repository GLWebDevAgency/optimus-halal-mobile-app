"use client";

import React from "react";
import { BottomTabBar } from "./home-screen";

const GOLD = "oklch(0.78 0.17 82)";

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

const pins = [
  { x: 80, y: 140 },
  { x: 200, y: 100 },
  { x: 150, y: 250 },
  { x: 290, y: 180 },
  { x: 110, y: 350 },
  { x: 260, y: 320 },
];

const filters = [
  { label: "Tous", active: true },
  { label: "AVS", active: false },
  { label: "Achahada", active: false },
  { label: "MCA", active: false },
];

function GoldPin({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle cx="0" cy="-6" r="8" fill={GOLD} opacity="0.9" />
      <polygon points="-4,-2 4,-2 0,6" fill={GOLD} opacity="0.9" />
      <circle cx="0" cy="-6" r="3.5" fill="#0f0f0f" />
    </g>
  );
}

function UserDot() {
  return (
    <g transform="translate(187, 280)">
      {/* Pulse ring */}
      <circle cx="0" cy="0" r="16" fill="rgba(59,130,246,0.15)">
        <animate attributeName="r" values="12;20;12" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0.08;0.3" dur="2s" repeatCount="indefinite" />
      </circle>
      {/* White border */}
      <circle cx="0" cy="0" r="7" fill="white" />
      {/* Blue dot */}
      <circle cx="0" cy="0" r="5" fill="#3b82f6" />
    </g>
  );
}

export function MapScreen() {
  return (
    <div
      className="relative w-full h-full flex flex-col"
      style={{ backgroundColor: "#e8e8e8" }}
    >
      {/* Status bar padding */}
      <div style={{ height: 44, backgroundColor: "transparent" }} />

      {/* Search bar overlay */}
      <div className="absolute top-[52px] left-4 right-4 z-10">
        <div
          className="flex items-center gap-2.5 rounded-full px-4 py-2.5 bg-white"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}
        >
          <SearchIcon />
          <span className="text-[#999] text-sm flex-1">Rechercher un magasin...</span>
        </div>
      </div>

      {/* Filter row overlay */}
      <div className="absolute top-[104px] left-0 right-0 z-10 px-4">
        <div className="flex gap-2 overflow-x-hidden">
          {filters.map((f) => (
            <div
              key={f.label}
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap"
              style={{
                backgroundColor: f.active ? GOLD : "white",
                color: f.active ? "#0f0f0f" : "#666",
                border: f.active ? "none" : "1px solid #ddd",
                boxShadow: f.active ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              {f.label}
            </div>
          ))}
        </div>
      </div>

      {/* Abstract map */}
      <div className="flex-1 relative">
        <svg
          viewBox="0 0 375 680"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Background */}
          <rect width="375" height="680" fill="#e8e8e8" />

          {/* Street grid — horizontal roads */}
          <rect x="0" y="80" width="375" height="12" fill="#f5f5f5" />
          <rect x="0" y="170" width="375" height="16" fill="#f5f5f5" />
          <rect x="0" y="280" width="375" height="10" fill="#f5f5f5" />
          <rect x="0" y="380" width="375" height="14" fill="#f5f5f5" />
          <rect x="0" y="490" width="375" height="12" fill="#f5f5f5" />

          {/* Street grid — vertical roads */}
          <rect x="60" y="0" width="10" fill="#f5f5f5" height="680" />
          <rect x="150" y="0" width="14" fill="#f5f5f5" height="680" />
          <rect x="250" y="0" width="10" fill="#f5f5f5" height="680" />
          <rect x="330" y="0" width="12" fill="#f5f5f5" height="680" />

          {/* Buildings / blocks */}
          <rect x="75" y="90" width="70" height="75" rx="4" fill="#ddd" />
          <rect x="170" y="90" width="75" height="75" rx="4" fill="#e0e0e0" />
          <rect x="170" y="195" width="75" height="80" rx="4" fill="#ddd" />
          <rect x="265" y="195" width="60" height="80" rx="4" fill="#e0e0e0" />
          <rect x="75" y="295" width="70" height="80" rx="4" fill="#e0e0e0" />
          <rect x="265" y="395" width="60" height="90" rx="4" fill="#ddd" />
          <rect x="75" y="395" width="70" height="90" rx="4" fill="#e0e0e0" />
          <rect x="170" y="395" width="75" height="90" rx="4" fill="#ddd" />

          {/* Pins */}
          {pins.map((pin, i) => (
            <GoldPin key={i} x={pin.x} y={pin.y} />
          ))}

          {/* User position */}
          <UserDot />
        </svg>
      </div>

      {/* Bottom tab bar */}
      <BottomTabBar activeTab="carte" />
    </div>
  );
}
