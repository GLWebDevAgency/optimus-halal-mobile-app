"use client";

import React from "react";

/* ─── Design tokens ─── */
const GOLD = "#D4AF37";

/* ════════════════════════════════════════════════════════════════════
   SVG Icons
   ════════════════════════════════════════════════════════════════════ */

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function FlashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ScanCaptureIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
  );
}

function ShieldSmallIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={GOLD} stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════════
   CSS Keyframes (injected inline via style tag)
   ════════════════════════════════════════════════════════════════════ */

const scanKeyframes = `
@keyframes scanSweep {
  0%, 100% { top: 0; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { top: calc(100% - 2px); opacity: 0; }
}
@keyframes cornerPulse {
  0%, 100% { opacity: 0.8; filter: drop-shadow(0 0 4px rgba(212,175,55,0.3)); }
  50% { opacity: 1; filter: drop-shadow(0 0 10px rgba(212,175,55,0.6)); }
}
@keyframes capturePulse {
  0%, 100% { box-shadow: 0 0 20px rgba(212,175,55,0.3); }
  50% { box-shadow: 0 0 40px rgba(212,175,55,0.5), 0 0 60px rgba(212,175,55,0.2); }
}
`;

/* ════════════════════════════════════════════════════════════════════
   Corner Bracket Component
   ════════════════════════════════════════════════════════════════════ */

function CornerBracket({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const size = 40;
  const stroke = 4;
  const radius = 16;
  const half = stroke / 2;

  const pathMap = {
    tl: `M ${half} ${size} L ${half} ${radius + half} Q ${half} ${half} ${radius + half} ${half} L ${size} ${half}`,
    tr: `M 0 ${half} L ${size - radius - half} ${half} Q ${size - half} ${half} ${size - half} ${radius + half} L ${size - half} ${size}`,
    bl: `M ${half} 0 L ${half} ${size - radius - half} Q ${half} ${size - half} ${radius + half} ${size - half} L ${size} ${size - half}`,
    br: `M 0 ${size - half} L ${size - radius - half} ${size - half} Q ${size - half} ${size - half} ${size - half} ${size - radius - half} L ${size - half} 0`,
  };

  const positionStyles: Record<string, React.CSSProperties> = {
    tl: { top: -2, left: -2 },
    tr: { top: -2, right: -2 },
    bl: { bottom: -2, left: -2 },
    br: { bottom: -2, right: -2 },
  };

  return (
    <svg
      className="absolute"
      style={{
        ...positionStyles[position],
        animation: "cornerPulse 2s ease-in-out infinite",
      }}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
    >
      <path
        d={pathMap[position]}
        fill="none"
        stroke={GOLD}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════════
   ScanScreen
   ════════════════════════════════════════════════════════════════════ */

export function ScanScreen() {
  const frameWidth = 260;
  const frameHeight = 230;

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: "#000" }}>
      {/* Inject keyframes */}
      <style>{scanKeyframes}</style>

      {/* Dark overlay with center cutout (simulated with 4 rects) */}
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(12,12,12,0.65)" }} />
      {/* Clear center area */}
      <div
        className="absolute"
        style={{
          left: "50%",
          top: "50%",
          width: frameWidth,
          height: frameHeight,
          transform: "translate(-50%, -60%)",
          backgroundColor: "transparent",
          boxShadow: "0 0 0 9999px rgba(12,12,12,0.65)",
        }}
      />

      {/* ─── Header ─── */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12 pb-6 z-10"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)",
        }}
      >
        {/* Close button */}
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 44,
            height: 44,
            backgroundColor: "rgba(212,175,55,0.08)",
            border: "1px solid rgba(212,175,55,0.2)",
          }}
        >
          <CloseIcon />
        </div>

        {/* Center badge */}
        <div
          className="flex items-center gap-1.5 rounded-full px-4 py-2"
          style={{
            backgroundColor: "rgba(12,12,12,0.85)",
            border: "1px solid rgba(212,175,55,0.25)",
          }}
        >
          <ShieldSmallIcon />
          <span className="text-white text-sm font-bold" style={{ letterSpacing: "0.05em" }}>
            Halal Scanner
          </span>
        </div>

        {/* Flash button */}
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 44,
            height: 44,
            backgroundColor: "rgba(212,175,55,0.08)",
            border: "1px solid rgba(212,175,55,0.2)",
          }}
        >
          <FlashIcon />
        </div>
      </div>

      {/* ─── Scan Frame (centered, shifted up slightly) ─── */}
      <div
        className="absolute"
        style={{
          left: "50%",
          top: "50%",
          width: frameWidth,
          height: frameHeight,
          transform: "translate(-50%, -60%)",
        }}
      >
        {/* Corner brackets */}
        <CornerBracket position="tl" />
        <CornerBracket position="tr" />
        <CornerBracket position="bl" />
        <CornerBracket position="br" />

        {/* Animated scan line */}
        <div
          className="absolute left-4 right-4"
          style={{
            height: 2,
            background: `linear-gradient(90deg, transparent 0%, ${GOLD} 30%, ${GOLD} 70%, transparent 100%)`,
            animation: "scanSweep 2.5s ease-in-out infinite",
            boxShadow: `0 0 8px rgba(212,175,55,0.4)`,
          }}
        />
      </div>

      {/* ─── Instruction Text ─── */}
      <div
        className="absolute left-1/2 flex items-center justify-center"
        style={{
          top: "50%",
          transform: "translate(-50%, calc(-60% + 140px))",
        }}
      >
        <div
          className="rounded-xl px-5 py-2.5"
          style={{
            backgroundColor: "rgba(12,12,12,0.7)",
            border: "1px solid rgba(212,175,55,0.15)",
          }}
        >
          <span className="text-white text-sm font-medium" style={{ letterSpacing: "0.05em" }}>
            Scanne. Comprends. Choisis.
          </span>
        </div>
      </div>

      {/* ─── Bottom Dock ─── */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-10 pb-10 pt-16 z-10"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 100%)",
        }}
      >
        {/* Gallery button */}
        <div className="flex flex-col items-center gap-1.5">
          <div
            className="flex items-center justify-center rounded-xl"
            style={{
              width: 48,
              height: 48,
              backgroundColor: "rgba(212,175,55,0.06)",
              border: "1px solid rgba(212,175,55,0.2)",
            }}
          >
            <GalleryIcon />
          </div>
          <span style={{ color: GOLD, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em" }}>
            GALERIE
          </span>
        </div>

        {/* Capture button (center, elevated) */}
        <div className="flex flex-col items-center" style={{ marginBottom: 24 }}>
          {/* Outer ring */}
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: 80,
              height: 80,
              border: "3px solid rgba(212,175,55,0.25)",
              animation: "capturePulse 2s ease-in-out infinite",
            }}
          >
            {/* Inner gold circle */}
            <div
              className="rounded-full flex items-center justify-center"
              style={{
                width: 60,
                height: 60,
                backgroundColor: GOLD,
                boxShadow: "0 4px 20px rgba(212,175,55,0.5)",
              }}
            >
              <ScanCaptureIcon />
            </div>
          </div>
        </div>

        {/* History button */}
        <div className="flex flex-col items-center gap-1.5">
          <div
            className="flex items-center justify-center rounded-xl"
            style={{
              width: 48,
              height: 48,
              backgroundColor: "rgba(212,175,55,0.06)",
              border: "1px solid rgba(212,175,55,0.2)",
            }}
          >
            <HistoryIcon />
          </div>
          <span style={{ color: GOLD, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em" }}>
            HISTORIQUE
          </span>
        </div>
      </div>
    </div>
  );
}
