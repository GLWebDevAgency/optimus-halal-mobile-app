"use client";

import React from "react";
import { BottomTabBar } from "./home-screen";

const GOLD = "oklch(0.78 0.17 82)";

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

const stats = [
  { value: "47", label: "Scans" },
  { value: "12", label: "Favoris" },
  { value: "Hanafi", label: "École" },
];

function ToggleSwitch({ on }: { on: boolean }) {
  return (
    <div
      className="relative rounded-full"
      style={{
        width: 40,
        height: 22,
        backgroundColor: on ? GOLD : "#333",
        transition: "background-color 0.2s",
      }}
    >
      <div
        className="absolute top-[2px] rounded-full bg-white"
        style={{
          width: 18,
          height: 18,
          left: on ? 20 : 2,
          transition: "left 0.2s",
        }}
      />
    </div>
  );
}

export function ProfileScreen() {
  return (
    <div
      className="relative w-full h-full flex flex-col"
      style={{ backgroundColor: "#0f0f0f" }}
    >
      {/* Status bar padding */}
      <div style={{ height: 44 }} />

      {/* Header */}
      <div className="text-center mb-5">
        <span className="text-white text-base font-semibold">Profil</span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {/* Avatar section */}
        <div className="flex flex-col items-center mb-6">
          <div
            className="rounded-full flex items-center justify-center mb-2.5"
            style={{
              width: 64,
              height: 64,
              background: `linear-gradient(135deg, ${GOLD}, #b8860b)`,
            }}
          >
            <span className="text-white text-xl font-bold">YM</span>
          </div>
          <div className="text-white text-lg font-bold mb-1.5">Youssef M.</div>
          {/* Naqiy+ badge with shimmer */}
          <div
            className="rounded-full px-3 py-1 text-xs font-bold"
            style={{
              backgroundColor: GOLD,
              color: "#0f0f0f",
              backgroundImage: `linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)`,
              backgroundSize: "200% 100%",
              animation: "shimmer 3s infinite linear",
            }}
          >
            Naqiy+
          </div>
          <style>{`
            @keyframes shimmer {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `}</style>
        </div>

        {/* Stats row */}
        <div
          className="flex items-center justify-around rounded-2xl py-4 mb-5"
          style={{ backgroundColor: "#1a1a1a" }}
        >
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-white font-bold text-base">{stat.value}</span>
              <span className="text-[#888] text-xs mt-0.5">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Settings section */}
        <div className="rounded-2xl overflow-hidden mb-4" style={{ backgroundColor: "#1a1a1a" }}>
          {/* École juridique */}
          <div
            className="flex items-center justify-between px-4 py-3.5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <span className="text-white text-sm">École juridique</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[#888] text-sm">Hanafi</span>
              <ChevronRight />
            </div>
          </div>

          {/* Notifications */}
          <div
            className="flex items-center justify-between px-4 py-3.5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <span className="text-white text-sm">Notifications</span>
            <ToggleSwitch on />
          </div>

          {/* Apparence */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-white text-sm">Apparence</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[#888] text-sm">Sombre</span>
              <ChevronRight />
            </div>
          </div>
        </div>

        {/* Subscription card */}
        <div
          className="rounded-2xl p-4 mb-6"
          style={{
            background: `linear-gradient(135deg, color-mix(in oklch, ${GOLD} 15%, #1a1a1a) 0%, #1a1a1a 100%)`,
            border: `1px solid color-mix(in oklch, ${GOLD} 20%, transparent)`,
          }}
        >
          <div className="text-[#999] text-xs font-medium mb-1.5">Mon abonnement</div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white text-sm font-bold">Naqiy+ Premium</span>
            <div
              className="rounded-full px-2 py-0.5 text-[9px] font-bold"
              style={{ backgroundColor: GOLD, color: "#0f0f0f" }}
            >
              PRO
            </div>
          </div>
          <div className="text-[#777] text-xs">Renouvellement : 15 avril 2026</div>
        </div>

        {/* Logout */}
        <div className="text-center">
          <span className="text-red-400 text-sm cursor-pointer">Déconnexion</span>
        </div>
      </div>

      {/* Bottom tab bar */}
      <BottomTabBar activeTab="profil" />
    </div>
  );
}
