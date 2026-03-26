"use client";

import React from "react";
import { BottomTabBar } from "./home-screen";

const GOLD = "#D4AF37";

/* ─── Icons (SVG inline) ─── */

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function HeartMonitorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function NoFoodIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function ScaleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="M7 21h10" />
      <path d="M12 3v18" />
      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
    </svg>
  );
}

function GavelIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m14.5 12.5-8 8a2.119 2.119 0 0 1-3-3l8-8" />
      <path d="m16 16 6-6" />
      <path d="m8 8 6-6" />
      <path d="m9 7 8 8" />
      <path d="m21 11-8-8" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5" fill="#c084fc" />
      <circle cx="17.5" cy="10.5" r=".5" fill="#c084fc" />
      <circle cx="8.5" cy="7.5" r=".5" fill="#c084fc" />
      <circle cx="6.5" cy="12.5" r=".5" fill="#c084fc" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z" />
      <path d="M3 20h18" />
    </svg>
  );
}

/* ─── Data ─── */

const preferencesItems = [
  {
    label: "Profil santé",
    icon: <HeartMonitorIcon />,
    iconBg: "rgba(244,114,182,0.15)",
    value: null,
  },
  {
    label: "Exclusions alimentaires",
    icon: <NoFoodIcon />,
    iconBg: "rgba(239,68,68,0.15)",
    value: null,
  },
  {
    label: "Certifications préférées",
    icon: <ShieldCheckIcon />,
    iconBg: "rgba(34,197,94,0.15)",
    value: "AVS, HMC",
  },
  {
    label: "École juridique",
    icon: <ScaleIcon />,
    iconBg: "rgba(212,175,55,0.15)",
    value: "Maliki",
  },
  {
    label: "Boycott & Éthique",
    icon: <GavelIcon />,
    iconBg: "rgba(239,68,68,0.15)",
    value: null,
  },
  {
    label: "Notifications push",
    icon: <BellIcon />,
    iconBg: "rgba(168,85,247,0.15)",
    value: null,
  },
];

const accountItems = [
  {
    label: "Mon abonnement",
    icon: <CrownIcon />,
    iconBg: "rgba(212,175,55,0.15)",
    value: "Naqiy+",
  },
  {
    label: "Apparence",
    icon: <PaletteIcon />,
    iconBg: "rgba(168,85,247,0.15)",
    value: "Sombre",
  },
  {
    label: "Langue",
    icon: <GlobeIcon />,
    iconBg: "rgba(255,255,255,0.06)",
    value: "Français",
  },
];

/* ─── Menu Item ─── */

function MenuItem({
  item,
  isFirst,
  isLast,
}: {
  item: { label: string; icon: React.ReactNode; iconBg: string; value: string | null };
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3"
      style={{
        padding: "11px 14px",
        backgroundColor: "rgba(255,255,255,0.03)",
        borderTopLeftRadius: isFirst ? 12 : 0,
        borderTopRightRadius: isFirst ? 12 : 0,
        borderBottomLeftRadius: isLast ? 12 : 0,
        borderBottomRightRadius: isLast ? 12 : 0,
        borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div
        className="rounded-full flex items-center justify-center flex-shrink-0"
        style={{ width: 28, height: 28, backgroundColor: item.iconBg }}
      >
        {item.icon}
      </div>
      <span className="text-white flex-1" style={{ fontSize: 13 }}>{item.label}</span>
      <div className="flex items-center gap-1">
        {item.value && (
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{item.value}</span>
        )}
        <ChevronRight />
      </div>
    </div>
  );
}

/* ─── ProfileScreen ─── */

export function ProfileScreen() {
  return (
    <div className="relative w-full h-full flex flex-col" style={{ backgroundColor: "#0f0f0f" }}>
      {/* Status bar padding */}
      <div style={{ height: 44 }} />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 96 }}>

        {/* ─── Hero Header ─── */}
        <div
          className="flex flex-col items-center"
          style={{
            padding: "20px 24px 16px 24px",
            background: "linear-gradient(to bottom, #0f0f0f, #1a1a1a)",
          }}
        >
          {/* Avatar */}
          <div
            className="rounded-full flex items-center justify-center mb-3"
            style={{
              width: 64,
              height: 64,
              padding: 2,
              background: `linear-gradient(135deg, ${GOLD}, #CFA533)`,
            }}
          >
            <div
              className="rounded-full w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, #CFA533, ${GOLD})` }}
            >
              <span className="text-white font-bold" style={{ fontSize: 22 }}>YM</span>
            </div>
          </div>

          <div className="text-white font-bold mb-0.5" style={{ fontSize: 20 }}>Mehdi L.</div>
          <div className="mb-3" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
            Salam, Mehdi !
          </div>

          {/* Naqiy+ badge */}
          <div
            className="rounded-full flex items-center gap-1.5"
            style={{
              padding: "4px 12px",
              backgroundColor: "rgba(212,175,55,0.15)",
              border: "1px solid rgba(212,175,55,0.25)",
            }}
          >
            <span style={{ color: GOLD, fontSize: 11 }}>⭐</span>
            <span style={{ color: GOLD, fontSize: 11, fontWeight: 700 }}>Naqiy+</span>
          </div>
        </div>

        {/* ─── Gamification Card ─── */}
        <div
          className="rounded-2xl"
          style={{
            margin: "0 16px 14px 16px",
            padding: 14,
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="rounded-full flex items-center justify-center flex-shrink-0"
              style={{ width: 44, height: 44, backgroundColor: "rgba(212,175,55,0.1)" }}
            >
              <span style={{ color: GOLD, fontSize: 13, fontWeight: 700 }}>Lvl 5</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>XP</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>2 450 / 3 800</span>
              </div>
              <div className="rounded-full w-full" style={{ height: 5, backgroundColor: "rgba(255,255,255,0.06)" }}>
                <div
                  className="rounded-full h-full"
                  style={{ width: "65%", background: `linear-gradient(90deg, #CFA533, ${GOLD})` }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-around">
            <div className="flex flex-col items-center">
              <span style={{ fontSize: 12, color: GOLD, fontWeight: 700 }}>🔥 7j</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Streak</span>
            </div>
            <div className="flex flex-col items-center">
              <span style={{ fontSize: 12, color: GOLD, fontWeight: 700 }}>⭐ 2 450</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Points</span>
            </div>
            <div className="flex flex-col items-center">
              <span style={{ fontSize: 12, color: GOLD, fontWeight: 700 }}>42</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Scans</span>
            </div>
          </div>
        </div>

        {/* ─── Préférences ─── */}
        <div style={{ padding: "0 16px", marginBottom: 14 }}>
          <div
            className="uppercase font-medium mb-2"
            style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em" }}
          >
            Préférences
          </div>
          <div>
            {preferencesItems.map((item, i) => (
              <MenuItem
                key={item.label}
                item={item}
                isFirst={i === 0}
                isLast={i === preferencesItems.length - 1}
              />
            ))}
          </div>
        </div>

        {/* ─── Compte ─── */}
        <div style={{ padding: "0 16px", marginBottom: 14 }}>
          <div
            className="uppercase font-medium mb-2"
            style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em" }}
          >
            Compte
          </div>
          <div>
            {accountItems.map((item, i) => (
              <MenuItem
                key={item.label}
                item={item}
                isFirst={i === 0}
                isLast={i === accountItems.length - 1}
              />
            ))}
          </div>
        </div>

        {/* ─── Déconnexion ─── */}
        <div style={{ padding: "0 16px 16px 16px" }}>
          <button
            className="w-full rounded-xl flex items-center justify-center gap-2"
            style={{
              height: 44,
              backgroundColor: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.15)",
              color: "#ef4444",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <SignOutIcon />
            Se déconnecter
          </button>
        </div>
      </div>

      {/* Bottom tab bar */}
      <BottomTabBar activeTab="profil" />
    </div>
  );
}
