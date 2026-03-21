"use client";

import React from "react";

const GOLD = "oklch(0.78 0.17 82)";

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function ScanIconSmall() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? GOLD : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function ScanTabIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? GOLD : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
  );
}

function MapIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? GOLD : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? GOLD : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
    </svg>
  );
}

interface TabProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

function Tab({ icon, label, active = false }: TabProps) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      {icon}
      <span
        className="text-[10px] font-medium"
        style={{ color: active ? GOLD : "#666" }}
      >
        {label}
      </span>
    </div>
  );
}

export function BottomTabBar({ activeTab = "home" }: { activeTab?: string }) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 flex items-center justify-around px-4 pb-8 pt-2"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      <Tab icon={<HomeIcon active={activeTab === "home"} />} label="Accueil" active={activeTab === "home"} />
      <Tab icon={<ScanTabIcon active={activeTab === "scanner"} />} label="Scanner" active={activeTab === "scanner"} />
      <Tab icon={<MapIcon active={activeTab === "carte"} />} label="Carte" active={activeTab === "carte"} />
      <Tab icon={<ProfileIcon active={activeTab === "profil"} />} label="Profil" active={activeTab === "profil"} />
    </div>
  );
}

interface ProductCardProps {
  emoji: string;
  name: string;
  brand: string;
  halal: boolean;
}

function ProductCard({ emoji, name, brand, halal }: ProductCardProps) {
  return (
    <div
      className="flex-shrink-0 rounded-2xl p-3 flex flex-col gap-1.5"
      style={{ backgroundColor: "#1a1a1a", width: 110, minHeight: 120 }}
    >
      <div className="text-2xl">{emoji}</div>
      <div className="text-white text-xs font-semibold leading-tight truncate">{name}</div>
      <div className="text-[#888] text-[10px] leading-tight truncate">{brand}</div>
      <div
        className="mt-auto self-start rounded-full px-2 py-0.5 text-[9px] font-bold"
        style={{
          backgroundColor: halal ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
          color: halal ? "#22c55e" : "#ef4444",
        }}
      >
        {halal ? "Halal" : "Haram"}
      </div>
    </div>
  );
}

interface StoreCardProps {
  name: string;
  distance: string;
  certification: string;
}

function StoreCard({ name, distance, certification }: StoreCardProps) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl p-3"
      style={{ backgroundColor: "#1a1a1a" }}
    >
      <div
        className="flex items-center justify-center rounded-lg"
        style={{ width: 40, height: 40, backgroundColor: "#252525" }}
      >
        <StoreIcon />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white text-sm font-semibold truncate">{name}</div>
        <div className="text-[#888] text-xs">{distance}</div>
      </div>
      <div
        className="rounded-full px-2 py-0.5 text-[9px] font-bold flex-shrink-0"
        style={{ backgroundColor: "rgba(34,197,94,0.15)", color: "#22c55e" }}
      >
        {certification}
      </div>
    </div>
  );
}

export function HomeScreen() {
  return (
    <div
      className="relative w-full h-full flex flex-col"
      style={{ backgroundColor: "#0f0f0f" }}
    >
      {/* Status bar padding */}
      <div style={{ height: 44 }} />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <span
            className="text-xl font-bold tracking-tight"
            style={{ color: GOLD }}
          >
            naqiy
          </span>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: 36, height: 36, backgroundColor: "#1a1a1a" }}
            >
              <BellIcon />
            </div>
            <div
              className="rounded-full"
              style={{
                width: 36,
                height: 36,
                background: `linear-gradient(135deg, ${GOLD}, #b8860b)`,
              }}
            >
              <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                M
              </div>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div
          className="flex items-center gap-2 rounded-full px-4 py-2.5 mb-6"
          style={{ backgroundColor: "#1a1a1a" }}
        >
          <SearchIcon />
          <span className="text-[#666] text-sm flex-1">
            Rechercher un produit...
          </span>
          <ScanIconSmall />
        </div>

        {/* Recently scanned section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white text-sm font-semibold">
              Scannés récemment
            </span>
            <span className="text-[10px] font-medium" style={{ color: GOLD }}>
              Voir tout
            </span>
          </div>
          <div className="flex gap-2.5 overflow-x-hidden">
            <ProductCard emoji="🍫" name="Nutella 400g" brand="Ferrero" halal />
            <ProductCard emoji="🍫" name="Kinder Bueno" brand="Ferrero" halal />
            <ProductCard emoji="🍬" name="Haribo Dragibus" brand="Haribo" halal={false} />
          </div>
        </div>

        {/* Nearby stores section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white text-sm font-semibold">
              Magasins proches
            </span>
            <span className="text-[10px] font-medium" style={{ color: GOLD }}>
              Voir tout
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            <StoreCard
              name="Carrefour Market"
              distance="1.2 km"
              certification="Certifié AVS"
            />
            <StoreCard
              name="Épicerie Al Baraka"
              distance="0.8 km"
              certification="Certifié Achahada"
            />
          </div>
        </div>
      </div>

      {/* Bottom tab bar */}
      <BottomTabBar activeTab="home" />
    </div>
  );
}
