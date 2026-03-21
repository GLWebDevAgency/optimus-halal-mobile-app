"use client";

import React from "react";
import { BottomTabBar } from "./home-screen";

const GOLD = "oklch(0.78 0.17 82)";

function FlashIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

export function ScanScreen() {
  const frameWidth = 200;
  const frameHeight = 150;
  const cornerSize = 24;
  const cornerStroke = 3;

  return (
    <div className="relative w-full h-full" style={{ backgroundColor: "#0f0f0f" }}>
      {/* Camera viewfinder simulation */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(30,30,30,0.6) 0%, rgba(10,10,10,0.95) 70%)",
        }}
      />

      {/* Scan frame container - centered */}
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingBottom: 100 }}>
        {/* Scan frame */}
        <div
          className="relative rounded-xl"
          style={{ width: frameWidth, height: frameHeight }}
        >
          {/* Pulsing gold border */}
          <div
            className="absolute inset-0 rounded-xl"
            style={{
              border: `2px solid ${GOLD}`,
              animation: "scan-pulse 2s ease-in-out infinite",
            }}
          />

          {/* Corner markers - top left */}
          <svg
            className="absolute"
            style={{ top: -2, left: -2 }}
            width={cornerSize}
            height={cornerSize}
            viewBox={`0 0 ${cornerSize} ${cornerSize}`}
          >
            <path
              d={`M ${cornerStroke / 2} ${cornerSize} L ${cornerStroke / 2} ${cornerStroke / 2} L ${cornerSize} ${cornerStroke / 2}`}
              fill="none"
              stroke={GOLD}
              strokeWidth={cornerStroke}
              strokeLinecap="round"
            />
          </svg>

          {/* Corner markers - top right */}
          <svg
            className="absolute"
            style={{ top: -2, right: -2 }}
            width={cornerSize}
            height={cornerSize}
            viewBox={`0 0 ${cornerSize} ${cornerSize}`}
          >
            <path
              d={`M 0 ${cornerStroke / 2} L ${cornerSize - cornerStroke / 2} ${cornerStroke / 2} L ${cornerSize - cornerStroke / 2} ${cornerSize}`}
              fill="none"
              stroke={GOLD}
              strokeWidth={cornerStroke}
              strokeLinecap="round"
            />
          </svg>

          {/* Corner markers - bottom left */}
          <svg
            className="absolute"
            style={{ bottom: -2, left: -2 }}
            width={cornerSize}
            height={cornerSize}
            viewBox={`0 0 ${cornerSize} ${cornerSize}`}
          >
            <path
              d={`M ${cornerStroke / 2} 0 L ${cornerStroke / 2} ${cornerSize - cornerStroke / 2} L ${cornerSize} ${cornerSize - cornerStroke / 2}`}
              fill="none"
              stroke={GOLD}
              strokeWidth={cornerStroke}
              strokeLinecap="round"
            />
          </svg>

          {/* Corner markers - bottom right */}
          <svg
            className="absolute"
            style={{ bottom: -2, right: -2 }}
            width={cornerSize}
            height={cornerSize}
            viewBox={`0 0 ${cornerSize} ${cornerSize}`}
          >
            <path
              d={`M ${cornerSize - cornerStroke / 2} 0 L ${cornerSize - cornerStroke / 2} ${cornerSize - cornerStroke / 2} L 0 ${cornerSize - cornerStroke / 2}`}
              fill="none"
              stroke={GOLD}
              strokeWidth={cornerStroke}
              strokeLinecap="round"
            />
          </svg>

          {/* Scanning line animation */}
          <div
            className="absolute left-2 right-2"
            style={{
              height: 2,
              background: `linear-gradient(90deg, transparent 0%, ${GOLD} 50%, transparent 100%)`,
              animation: "scan-sweep 2.5s ease-in-out infinite",
              opacity: 0.6,
            }}
          />
        </div>

        {/* Instruction text */}
        <p className="text-white text-sm text-center mt-6 px-8 opacity-80">
          Placez le code-barres dans le cadre
        </p>
      </div>

      {/* Bottom controls */}
      <div
        className="absolute flex items-center justify-between px-16"
        style={{ bottom: 100, left: 0, right: 0 }}
      >
        <button className="flex items-center justify-center" style={{ width: 48, height: 48 }}>
          <FlashIcon />
        </button>
        <button className="flex items-center justify-center" style={{ width: 48, height: 48 }}>
          <GalleryIcon />
        </button>
      </div>

      {/* Bottom tab bar */}
      <BottomTabBar activeTab="scanner" />
    </div>
  );
}
