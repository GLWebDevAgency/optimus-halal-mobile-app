import React from "react";
import { cn } from "@/lib/utils";

interface PhoneFrameProps {
  children: React.ReactNode;
  className?: string;
}

export function PhoneFrame({ children, className }: PhoneFrameProps) {
  const scale = 264 / 375;

  return (
    <div
      className={cn(
        "relative w-[280px] h-[572px] rounded-[44px] bg-[#1a1a1a] phone-shadow",
        className
      )}
    >
      {/* Edge highlight overlay */}
      <div
        className="absolute inset-0 rounded-[44px] pointer-events-none z-10"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.05) 100%)",
        }}
      />

      {/* Dynamic island */}
      <div className="absolute top-[18px] left-1/2 -translate-x-1/2 h-[22px] w-[80px] rounded-full bg-black z-20" />

      {/* Screen area */}
      <div className="absolute inset-[8px] overflow-hidden rounded-[36px] bg-black">
        {/* Screen content at native resolution, scaled down */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 375,
            height: 812,
            transformOrigin: "top left",
            transform: `scale(${scale})`,
          }}
        >
          {children}
        </div>
      </div>

      {/* Home indicator */}
      <div className="absolute bottom-[10px] left-1/2 -translate-x-1/2 h-[4px] w-[100px] rounded-full bg-white/20 z-20" />
    </div>
  );
}
