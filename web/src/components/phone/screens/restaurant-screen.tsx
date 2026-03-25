"use client";

import React from "react";

const GOLD = "#D4AF37";

/* ─── Icons ─── */

function MapPinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
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

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function NavigationIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f0f0f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

/* ─── Star Rating ─── */

function StarRating({ rating, count }: { rating: number; count: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.3;
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-white font-bold" style={{ fontSize: 15 }}>{rating}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => {
          if (i <= fullStars) {
            return <span key={i} style={{ color: GOLD, fontSize: 14, lineHeight: 1 }}>&#9733;</span>;
          }
          if (i === fullStars + 1 && hasHalf) {
            return (
              <span key={i} style={{ position: "relative", fontSize: 14, lineHeight: 1 }}>
                <span style={{ color: "rgba(255,255,255,0.15)" }}>&#9733;</span>
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    overflow: "hidden",
                    width: "50%",
                    color: GOLD,
                  }}
                >
                  &#9733;
                </span>
              </span>
            );
          }
          return <span key={i} style={{ color: "rgba(255,255,255,0.15)", fontSize: 14, lineHeight: 1 }}>&#9733;</span>;
        })}
      </div>
      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>({count} avis)</span>
    </div>
  );
}

/* ─── Hours Table ─── */

const hours = [
  { day: "Lundi", time: "11h00 – 22h00" },
  { day: "Mardi", time: "11h00 – 22h00" },
  { day: "Mercredi", time: "11h00 – 22h00" },
  { day: "Jeudi", time: "11h00 – 22h00" },
  { day: "Vendredi", time: "11h00 – 23h00", current: true },
  { day: "Samedi", time: "11h00 – 23h00" },
  { day: "Dimanche", time: "12h00 – 21h00" },
];

/* ─── Map background pins ─── */

const bgPins = [
  { x: 100, y: 70 },
  { x: 220, y: 50 },
  { x: 300, y: 110 },
  { x: 70, y: 180 },
  { x: 280, y: 200 },
];

function SmallGoldPin({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle cx="0" cy="-5" r="6" fill={GOLD} opacity="0.7" />
      <polygon points="-3,-1 3,-1 0,5" fill={GOLD} opacity="0.7" />
      <circle cx="0" cy="-5" r="2.5" fill="#1a1a1a" />
    </g>
  );
}

/* ─── RestaurantScreen ─── */

export function RestaurantScreen() {
  return (
    <div className="relative w-full h-full flex flex-col" style={{ backgroundColor: "#1a1a1a" }}>
      {/* Abstract map background — top ~35% */}
      <div className="relative" style={{ height: "35%" }}>
        <svg
          viewBox="0 0 375 300"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid slice"
        >
          <rect width="375" height="300" fill="#1a1a1a" />

          {/* Grid roads */}
          <rect x="0" y="60" width="375" height="1" fill="rgba(255,255,255,0.05)" />
          <rect x="0" y="130" width="375" height="1.5" fill="rgba(255,255,255,0.04)" />
          <rect x="0" y="200" width="375" height="1" fill="rgba(255,255,255,0.05)" />
          <rect x="0" y="260" width="375" height="1.5" fill="rgba(255,255,255,0.04)" />
          <rect x="70" y="0" width="1" fill="rgba(255,255,255,0.05)" height="300" />
          <rect x="150" y="0" width="1.5" fill="rgba(255,255,255,0.04)" height="300" />
          <rect x="240" y="0" width="1" fill="rgba(255,255,255,0.05)" height="300" />
          <rect x="320" y="0" width="1.5" fill="rgba(255,255,255,0.04)" height="300" />

          {/* Blocks */}
          <rect x="75" y="65" width="70" height="60" rx="3" fill="rgba(255,255,255,0.02)" />
          <rect x="155" y="65" width="80" height="60" rx="3" fill="rgba(255,255,255,0.025)" />
          <rect x="245" y="135" width="70" height="60" rx="3" fill="rgba(255,255,255,0.02)" />
          <rect x="75" y="205" width="70" height="50" rx="3" fill="rgba(255,255,255,0.025)" />

          {/* Background pins */}
          {bgPins.map((pin, i) => (
            <SmallGoldPin key={i} x={pin.x} y={pin.y} />
          ))}

          {/* Active selected pin — larger, highlighted */}
          <g transform="translate(185, 150)">
            <circle cx="0" cy="0" r="16" fill="rgba(212,175,55,0.15)">
              <animate attributeName="r" values="14;20;14" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.2;0.06;0.2" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="0" cy="-8" r="11" fill={GOLD} />
            <polygon points="-6,-2 6,-2 0,9" fill={GOLD} />
            <circle cx="0" cy="-8" r="4.5" fill="white" />
          </g>

          {/* User dot */}
          <g transform="translate(230, 220)">
            <circle cx="0" cy="0" r="10" fill="rgba(59,130,246,0.15)">
              <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0.08;0.3" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="0" cy="0" r="5" fill="white" />
            <circle cx="0" cy="0" r="3.5" fill="#3b82f6" />
          </g>
        </svg>
      </div>

      {/* Bottom Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 flex flex-col"
        style={{
          height: "65%",
          backgroundColor: "#1a1a1a",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center" style={{ paddingTop: 8, paddingBottom: 4 }}>
          <div className="rounded-full" style={{ width: 36, height: 4, backgroundColor: "rgba(255,255,255,0.2)" }} />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 24 }}>

          {/* Store Header */}
          <div style={{ padding: "8px 16px 0 16px" }}>
            {/* Store image placeholder */}
            <div
              className="rounded-xl mb-3 overflow-hidden"
              style={{
                width: "100%",
                height: 120,
                background: "linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)",
              }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <span style={{ fontSize: 32, opacity: 0.2 }}>🍽️</span>
              </div>
            </div>

            {/* Name */}
            <div className="text-white font-bold mb-1" style={{ fontSize: 18 }}>Istanbul Kebab</div>

            {/* Type badge + Certifier */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className="rounded-full"
                style={{
                  padding: "3px 10px",
                  fontSize: 11,
                  backgroundColor: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                Restaurant
              </span>
              <div className="flex items-center gap-1">
                <ShieldCheckIcon />
                <span style={{ fontSize: 13, color: "#22c55e", fontWeight: 500 }}>Certifié AVS</span>
              </div>
            </div>

            {/* Rating */}
            <div className="mb-3">
              <StarRating rating={4.5} count={127} />
            </div>
          </div>

          {/* Info Row */}
          <div style={{ padding: "0 16px 12px 16px" }} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <MapPinIcon />
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", flex: 1 }}>
                12 Rue de la Paix, 75002 Paris
              </span>
              <span style={{ fontSize: 13, color: GOLD, fontWeight: 600 }}>1.2 km</span>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon />
              <span style={{ fontSize: 13, color: "#22c55e" }}>
                Ouvert
              </span>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                · Ferme à 22h00
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2" style={{ padding: "0 16px 16px 16px" }}>
            {/* Appeler */}
            <button
              className="w-full rounded-xl flex items-center justify-center gap-2"
              style={{
                height: 48,
                backgroundColor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "white",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              <PhoneIcon />
              Appeler
            </button>

            {/* Itinéraire */}
            <button
              className="w-full rounded-xl flex items-center justify-center gap-2"
              style={{
                height: 48,
                backgroundColor: GOLD,
                color: "#0f0f0f",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              <NavigationIcon />
              Itinéraire
            </button>

            {/* Favori */}
            <button
              className="w-full rounded-xl flex items-center justify-center gap-2"
              style={{
                height: 48,
                backgroundColor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "white",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              <HeartIcon />
              Favori
            </button>
          </div>

          {/* Hours Table */}
          <div style={{ padding: "0 16px" }}>
            <div className="text-white font-bold mb-2" style={{ fontSize: 14 }}>Horaires</div>
            <div className="flex flex-col">
              {hours.map((h) => (
                <div
                  key={h.day}
                  className="flex items-center justify-between"
                  style={{ padding: "6px 0" }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: h.current ? GOLD : "rgba(255,255,255,0.5)",
                      fontWeight: h.current ? 600 : 400,
                    }}
                  >
                    {h.day}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      color: h.current ? GOLD : "white",
                      fontWeight: h.current ? 600 : 400,
                    }}
                  >
                    {h.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
