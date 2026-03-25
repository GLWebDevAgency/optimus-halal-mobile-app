"use client";

import React from "react";
import { BottomTabBar } from "./home-screen";

const GOLD = "#D4AF37";

/* ─── Icons ─── */

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
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

function BellSmallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5" fill="#a855f7" />
      <circle cx="17.5" cy="10.5" r=".5" fill="#a855f7" />
      <circle cx="8.5" cy="7.5" r=".5" fill="#a855f7" />
      <circle cx="6.5" cy="12.5" r=".5" fill="#a855f7" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
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

function ClockSmallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ScanSmallIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
  );
}

function HeartSmallIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function MapPinSmallIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function StarSmallIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
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

/* ─── Data ─── */

const statsGrid = [
  {
    value: "47",
    label: "Scans",
    icon: <ScanSmallIcon />,
    bgColor: "rgba(34,197,94,0.15)",
  },
  {
    value: "12",
    label: "Favoris",
    icon: <HeartSmallIcon />,
    bgColor: "rgba(212,175,55,0.15)",
  },
  {
    value: "8",
    label: "Magasins",
    icon: <MapPinSmallIcon />,
    bgColor: "rgba(59,130,246,0.15)",
  },
  {
    value: "Naqiy+",
    label: "Actif",
    icon: <StarSmallIcon />,
    bgColor: "rgba(212,175,55,0.15)",
  },
];

const settingsPreferences = [
  {
    label: "École juridique",
    icon: <ScaleIcon />,
    iconBg: "rgba(212,175,55,0.15)",
    value: "Maliki",
  },
  {
    label: "Notifications",
    icon: <BellSmallIcon />,
    iconBg: "rgba(59,130,246,0.15)",
    value: null,
  },
  {
    label: "Apparence",
    icon: <PaletteIcon />,
    iconBg: "rgba(168,85,247,0.15)",
    value: "Sombre",
  },
];

const settingsAccount = [
  {
    label: "Mon abonnement",
    icon: <CrownIcon />,
    iconBg: "rgba(212,175,55,0.15)",
    value: "Naqiy+",
  },
  {
    label: "Historique des scans",
    icon: <ClockSmallIcon />,
    iconBg: "rgba(255,255,255,0.08)",
    value: null,
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
        padding: 14,
        backgroundColor: "rgba(255,255,255,0.03)",
        borderTopLeftRadius: isFirst ? 12 : 0,
        borderTopRightRadius: isFirst ? 12 : 0,
        borderBottomLeftRadius: isLast ? 12 : 0,
        borderBottomRightRadius: isLast ? 12 : 0,
        borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.04)",
      }}
    >
      {/* Icon circle */}
      <div
        className="rounded-full flex items-center justify-center flex-shrink-0"
        style={{ width: 28, height: 28, backgroundColor: item.iconBg }}
      >
        {item.icon}
      </div>

      {/* Label */}
      <span className="text-white flex-1" style={{ fontSize: 14 }}>{item.label}</span>

      {/* Value + Chevron */}
      <div className="flex items-center gap-1">
        {item.value && (
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{item.value}</span>
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
            padding: "24px 24px 20px 24px",
            background: "linear-gradient(to bottom, #0f0f0f, #1a1a1a)",
          }}
        >
          {/* Avatar with gold ring */}
          <div
            className="rounded-full flex items-center justify-center mb-3"
            style={{
              width: 68,
              height: 68,
              padding: 2,
              background: `linear-gradient(135deg, ${GOLD}, #CFA533)`,
            }}
          >
            <div
              className="rounded-full w-full h-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, #CFA533, ${GOLD})`,
              }}
            >
              <span className="text-white font-bold" style={{ fontSize: 24 }}>YM</span>
            </div>
          </div>

          {/* Name */}
          <div className="text-white font-bold mb-0.5" style={{ fontSize: 22 }}>Mehdi L.</div>

          {/* Greeting */}
          <div className="mb-3" style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
            Salam, Mehdi !
          </div>

          {/* Naqiy+ badge with shimmer */}
          <div
            className="rounded-full flex items-center gap-1.5"
            style={{
              padding: "5px 14px",
              backgroundColor: "rgba(212,175,55,0.15)",
              border: "1px solid rgba(212,175,55,0.25)",
              backgroundImage: "linear-gradient(110deg, transparent 30%, rgba(212,175,55,0.25) 50%, transparent 70%)",
              backgroundSize: "200% 100%",
              animation: "profileShimmer 3s infinite linear",
            }}
          >
            <span style={{ color: GOLD, fontSize: 13, lineHeight: 1 }}>⭐</span>
            <span style={{ color: GOLD, fontSize: 11, fontWeight: 700 }}>Naqiy+</span>
          </div>

          <style>{`
            @keyframes profileShimmer {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `}</style>
        </div>

        {/* ─── Gamification Card ─── */}
        <div
          className="rounded-2xl"
          style={{
            margin: "0 16px 16px 16px",
            padding: 16,
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {/* Level badge + XP bar row */}
          <div className="flex items-center gap-3 mb-3">
            {/* Level circle */}
            <div
              className="rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                width: 48,
                height: 48,
                backgroundColor: "rgba(212,175,55,0.1)",
              }}
            >
              <span style={{ color: GOLD, fontSize: 14, fontWeight: 700 }}>Lvl 5</span>
            </div>

            {/* XP bar */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>XP</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>2,450 / 3,800</span>
              </div>
              <div
                className="rounded-full w-full"
                style={{ height: 6, backgroundColor: "rgba(255,255,255,0.06)" }}
              >
                <div
                  className="rounded-full h-full"
                  style={{
                    width: "65%",
                    background: `linear-gradient(90deg, #CFA533, ${GOLD})`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-around">
            <div className="flex flex-col items-center">
              <span style={{ fontSize: 13, color: GOLD, fontWeight: 700 }}>🔥 7j</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Streak</span>
            </div>
            <div className="flex flex-col items-center">
              <span style={{ fontSize: 13, color: GOLD, fontWeight: 700 }}>⭐ 2 450</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Points</span>
            </div>
            <div className="flex flex-col items-center">
              <span style={{ fontSize: 13, color: GOLD, fontWeight: 700 }}>42</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Scans</span>
            </div>
          </div>
        </div>

        {/* ─── Stats Grid 2x2 ─── */}
        <div
          className="grid grid-cols-2 gap-3"
          style={{ padding: "0 16px", marginBottom: 16 }}
        >
          {statsGrid.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl"
              style={{
                padding: 14,
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Icon circle */}
              <div
                className="rounded-full flex items-center justify-center mb-2"
                style={{ width: 32, height: 32, backgroundColor: stat.bgColor }}
              >
                {stat.icon}
              </div>
              <div className="text-white font-bold" style={{ fontSize: 18 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ─── Settings: Préférences ─── */}
        <div style={{ padding: "0 16px", marginBottom: 16 }}>
          <div
            className="uppercase font-medium mb-2"
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.4)",
              letterSpacing: "0.05em",
            }}
          >
            Préférences
          </div>
          <div>
            {settingsPreferences.map((item, i) => (
              <MenuItem
                key={item.label}
                item={item}
                isFirst={i === 0}
                isLast={i === settingsPreferences.length - 1}
              />
            ))}
          </div>
        </div>

        {/* ─── Settings: Mon compte ─── */}
        <div style={{ padding: "0 16px", marginBottom: 16 }}>
          <div
            className="uppercase font-medium mb-2"
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.4)",
              letterSpacing: "0.05em",
            }}
          >
            Mon compte
          </div>
          <div>
            {settingsAccount.map((item, i) => (
              <MenuItem
                key={item.label}
                item={item}
                isFirst={i === 0}
                isLast={i === settingsAccount.length - 1}
              />
            ))}
          </div>
        </div>

        {/* ─── Logout Button ─── */}
        <div style={{ padding: "0 16px 16px 16px" }}>
          <button
            className="w-full rounded-xl flex items-center justify-center gap-2"
            style={{
              height: 48,
              backgroundColor: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.15)",
              color: "#ef4444",
              fontSize: 14,
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
