"use client";

import React from "react";

/* ─── Design tokens ─── */
const GOLD = "#D4AF37";
const GOLD_LIGHT = "#FDE08B";
const GOLD_MID = "#CFA533";
const GREEN = "#22c55e";
const BG = "#0f0f0f";
const CARD_BG = "#1a1a1a";
const GLASS_BG = "rgba(255,255,255,0.06)";
const GLASS_BORDER = "rgba(255,255,255,0.08)";
const TEXT_PRIMARY = "#ffffff";
const TEXT_SECONDARY = "rgba(255,255,255,0.7)";
const TEXT_MUTED = "rgba(255,255,255,0.5)";

/* ════════════════════════════════════════════════════════════════════
   SVG Icons
   ════════════════════════════════════════════════════════════════════ */

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function ScanIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function HomeIconFilled() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={GOLD} stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function HomeIconOutline() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function MapTabIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? GOLD : "none"} stroke={active ? GOLD : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ScanTabIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
  );
}

function ShopTabIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? GOLD : "none"} stroke={active ? GOLD : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
    </svg>
  );
}

function ProfileTabIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? GOLD : "none"} stroke={active ? GOLD : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════════
   BottomTabBar (shared across screens)
   ════════════════════════════════════════════════════════════════════ */

function TabItem({ icon, label, active }: { icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5" style={{ minWidth: 48 }}>
      {icon}
      <span className="text-[10px] font-medium" style={{ color: active ? GOLD : "#666" }}>
        {label}
      </span>
    </div>
  );
}

export function BottomTabBar({ activeTab = "home" }: { activeTab?: string }) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 flex items-end justify-around px-3 pb-7 pt-2"
      style={{
        backgroundColor: "#0a0a0a",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        zIndex: 20,
      }}
    >
      <TabItem
        icon={activeTab === "home" ? <HomeIconFilled /> : <HomeIconOutline />}
        label="Accueil"
        active={activeTab === "home"}
      />
      <TabItem
        icon={<MapTabIcon active={activeTab === "carte"} />}
        label="Carte"
        active={activeTab === "carte"}
      />

      {/* Center floating scanner button */}
      <div className="flex flex-col items-center" style={{ marginTop: -28 }}>
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 52,
            height: 52,
            background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})`,
            boxShadow: `0 4px 20px rgba(212,175,55,0.4), 0 0 40px rgba(212,175,55,0.15)`,
          }}
        >
          <ScanTabIcon />
        </div>
        <span className="text-[10px] font-medium mt-0.5" style={{ color: activeTab === "scanner" ? GOLD : "#666" }}>
          Scanner
        </span>
      </div>

      <TabItem
        icon={<ShopTabIcon active={activeTab === "shop"} />}
        label="Shop"
        active={activeTab === "shop"}
      />
      <TabItem
        icon={<ProfileTabIcon active={activeTab === "profil"} />}
        label="Profil"
        active={activeTab === "profil"}
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   Section Components
   ════════════════════════════════════════════════════════════════════ */

/* --- Hero Header --- */
function HeroHeader() {
  return (
    <div className="px-5 pt-2 pb-3">
      {/* Top row */}
      <div className="flex items-center justify-between mb-2.5">
        {/* Left: Avatar + greeting */}
        <div className="flex items-center gap-3">
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: 40,
              height: 40,
              background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})`,
              padding: 2,
            }}
          >
            <div
              className="rounded-full w-full h-full flex items-center justify-center"
              style={{ backgroundColor: "#1a1a1a" }}
            >
              <span className="text-white text-xs font-bold">YM</span>
            </div>
          </div>
          <span
            className="font-extrabold"
            style={{ color: TEXT_PRIMARY, fontSize: 22, letterSpacing: -0.5 }}
          >
            Salam, Mehdi
          </span>
        </div>

        {/* Right: Brand + bell */}
        <div className="flex items-center gap-3">
          <span
            className="text-lg font-bold"
            style={{
              background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            naqiy
          </span>
          <div className="relative">
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: 36, height: 36, backgroundColor: GLASS_BG }}
            >
              <BellIcon />
            </div>
            {/* Red badge dot */}
            <div
              className="absolute rounded-full"
              style={{
                width: 8,
                height: 8,
                backgroundColor: "#ef4444",
                top: 2,
                right: 2,
                border: `2px solid ${BG}`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Impact Stats Pill */}
      <div
        className="inline-flex items-center rounded-full"
        style={{
          backgroundColor: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(212,175,55,0.15)",
          padding: "6px 12px",
        }}
      >
        <span style={{ color: TEXT_SECONDARY, fontSize: 11 }}>
          42 Verifies
        </span>
        <span style={{ color: TEXT_MUTED, fontSize: 11, margin: "0 6px" }}>|</span>
        <span style={{ color: TEXT_SECONDARY, fontSize: 11 }}>
          5 Alertes
        </span>
        <span style={{ color: TEXT_MUTED, fontSize: 11, margin: "0 6px" }}>|</span>
        <span style={{ color: TEXT_SECONDARY, fontSize: 11 }}>
          Lvl 3 🔥 7j
        </span>
      </div>
    </div>
  );
}

/* --- Quick Actions 2x2 Grid --- */
function QuickActions() {
  return (
    <div className="px-5 mb-5">
      <div className="grid grid-cols-2 gap-3">
        {/* Scanner - primary gold */}
        <div
          className="relative rounded-2xl p-3.5 flex flex-col justify-between overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD_MID})`,
            minHeight: 90,
            boxShadow: "0 4px 24px rgba(212,175,55,0.3)",
          }}
        >
          <div className="flex items-start justify-between">
            <ScanIcon />
            <ArrowRightIcon />
          </div>
          <div>
            <div className="text-white text-sm font-bold leading-tight">Scanner</div>
            <div className="text-white/80 text-[11px] leading-tight">Verifier un produit</div>
          </div>
        </div>

        {/* Magasins - glass */}
        <GlassActionCard
          icon={<MapPinIcon />}
          title="Magasins"
          subtitle="Autour de vous"
        />

        {/* Veille - glass */}
        <GlassActionCard
          icon={<ShieldIcon />}
          title="Veille"
          subtitle="Alertes halal"
        />

        {/* Historique - glass */}
        <GlassActionCard
          icon={<ClockIcon />}
          title="Historique"
          subtitle="Derniers scans"
        />
      </div>
    </div>
  );
}

function GlassActionCard({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div
      className="rounded-2xl p-3.5 flex flex-col justify-between"
      style={{
        backgroundColor: GLASS_BG,
        border: `1px solid ${GLASS_BORDER}`,
        minHeight: 90,
      }}
    >
      <div>{icon}</div>
      <div>
        <div className="text-white text-sm font-bold leading-tight">{title}</div>
        <div style={{ color: TEXT_MUTED, fontSize: 11, lineHeight: 1.3 }}>{subtitle}</div>
      </div>
    </div>
  );
}

/* --- Nearby Stores Carousel --- */
const FAKE_STORES = [
  { name: "Istanbul Kebab", type: "Restaurant", open: true },
  { name: "Boucherie Al-Baraka", type: "Boucherie", open: true },
  { name: "Epicerie Salam", type: "Epicerie", open: false },
];

function NearbyStoresCarousel() {
  return (
    <div className="mb-5">
      {/* Section header */}
      <div className="flex items-center justify-between px-5 mb-3">
        <span className="text-white font-bold" style={{ fontSize: 16 }}>
          Autour de vous
        </span>
        <span style={{ color: GOLD, fontSize: 13 }} className="font-medium">
          Voir tout →
        </span>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-3 overflow-x-hidden px-5">
        {FAKE_STORES.map((store) => (
          <div
            key={store.name}
            className="relative rounded-xl overflow-hidden flex-shrink-0 flex flex-col justify-end p-3"
            style={{
              width: 200,
              height: 120,
              backgroundColor: GLASS_BG,
              border: `1px solid ${GLASS_BORDER}`,
            }}
          >
            {/* Status badge */}
            <div
              className="absolute top-2.5 right-2.5 rounded-full px-2 py-0.5"
              style={{
                backgroundColor: store.open ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                color: store.open ? GREEN : "#ef4444",
                fontSize: 8,
                fontWeight: 700,
              }}
            >
              {store.open ? "Ouvert" : "Ferme"}
            </div>

            {/* Certifier logo placeholder */}
            <div
              className="absolute bottom-3 right-3 rounded flex items-center justify-center"
              style={{
                width: 16,
                height: 16,
                backgroundColor: "rgba(255,255,255,0.1)",
              }}
            >
              <span style={{ fontSize: 8, color: TEXT_MUTED }}>C</span>
            </div>

            {/* Store info */}
            <div className="text-white text-sm font-bold leading-tight">{store.name}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span style={{ color: TEXT_MUTED, fontSize: 11 }}>{store.type}</span>
              <span style={{ color: GOLD, fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
                CERTIFIE
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --- Quick Favorites (Stories-style circles) --- */
const FAKE_PRODUCTS = [
  { initial: "N", name: "Nutella" },
  { initial: "K", name: "Kinder" },
  { initial: "H", name: "Haribo" },
  { initial: "O", name: "Oreo" },
  { initial: "B", name: "BN" },
];

function QuickFavorites() {
  return (
    <div className="mb-5">
      {/* Section header */}
      <div className="flex items-center justify-between px-5 mb-3">
        <span className="text-white font-bold" style={{ fontSize: 16 }}>
          Favoris
        </span>
        <div
          className="flex items-center rounded-full overflow-hidden"
          style={{
            backgroundColor: "rgba(255,255,255,0.06)",
            border: `1px solid ${GLASS_BORDER}`,
          }}
        >
          <span
            className="px-3 py-1 text-[11px] font-semibold"
            style={{ backgroundColor: "rgba(212,175,55,0.15)", color: GOLD }}
          >
            Produits
          </span>
          <span
            className="px-3 py-1 text-[11px] font-semibold"
            style={{ color: TEXT_MUTED }}
          >
            Magasins
          </span>
        </div>
      </div>

      {/* Stories-style row */}
      <div className="flex gap-3 overflow-x-hidden px-5">
        {FAKE_PRODUCTS.map((product) => (
          <div key={product.initial} className="flex flex-col items-center" style={{ width: 56 }}>
            {/* Gradient ring */}
            <div
              className="rounded-full flex items-center justify-center"
              style={{
                width: 56,
                height: 56,
                background: `linear-gradient(135deg, ${GREEN}, ${GOLD})`,
                padding: 2,
              }}
            >
              <div
                className="rounded-full w-full h-full flex items-center justify-center"
                style={{ backgroundColor: CARD_BG }}
              >
                <span className="text-white text-lg font-bold">{product.initial}</span>
              </div>
            </div>
            {/* Label */}
            <span
              className="mt-1 text-center truncate w-full"
              style={{ color: TEXT_MUTED, fontSize: 10 }}
            >
              {product.name}
            </span>
          </div>
        ))}

        {/* Add circle */}
        <div className="flex flex-col items-center" style={{ width: 56 }}>
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: 56,
              height: 56,
              border: `2px dashed rgba(212,175,55,0.4)`,
            }}
          >
            <PlusIcon />
          </div>
          <span
            className="mt-1 text-center truncate w-full"
            style={{ color: TEXT_MUTED, fontSize: 10 }}
          >
            Ajouter
          </span>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   HomeScreen
   ════════════════════════════════════════════════════════════════════ */

export function HomeScreen() {
  return (
    <div className="relative w-full h-full flex flex-col" style={{ backgroundColor: BG }}>
      {/* Status bar padding */}
      <div style={{ height: 44 }} />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-24">
        <HeroHeader />
        <QuickActions />
        <NearbyStoresCarousel />
        <QuickFavorites />
      </div>

      {/* Bottom tab bar */}
      <BottomTabBar activeTab="home" />
    </div>
  );
}
