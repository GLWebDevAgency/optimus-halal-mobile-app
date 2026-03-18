"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════ */

type Particle = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  hue: number;
  duration: number;
};

type BeamConfig = {
  id: number;
  left: string;
  width: number;
  angle: number;
  duration: number;
  delay: number;
  opacity: number;
  hueShift: number;
};

type BackgroundBeamsProps = {
  className?: string;
  children?: ReactNode;
  beamCount?: number;
  particleCount?: number;
};

/* ═══════════════════════════════════════════════
   BEAM DEFINITIONS
   ═══════════════════════════════════════════════ */

function generateBeams(count: number): BeamConfig[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${10 + (i * 80) / (count - 1 || 1)}%`,
    width: 1.5 + Math.random() * 2.5,
    angle: -15 + Math.random() * 30,
    duration: 3.5 + Math.random() * 3,
    delay: Math.random() * 4,
    opacity: 0.15 + Math.random() * 0.25,
    hueShift: -10 + Math.random() * 20,
  }));
}

/* ═══════════════════════════════════════════════
   COLLISION ZONE — particle explosions
   ═══════════════════════════════════════════════ */

function CollisionZone({ particles }: { particles: Particle[] }) {
  return (
    <AnimatePresence>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            x: p.x,
            y: p.y,
            scale: 1,
            opacity: p.opacity,
          }}
          animate={{
            x: p.x + p.vx * 80,
            y: p.y + p.vy * 80,
            scale: 0,
            opacity: 0,
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: p.duration,
            ease: "easeOut",
          }}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: `oklch(0.80 0.16 ${85 + p.hue})`,
            boxShadow: `0 0 ${p.size * 2}px oklch(0.80 0.16 ${85 + p.hue} / 60%)`,
          }}
        />
      ))}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════
   BEAM ELEMENT
   Uses CSS @keyframes beam-fall from globals.css
   ═══════════════════════════════════════════════ */

function Beam({
  config,
  onCollision,
}: {
  config: BeamConfig;
  onCollision: (x: number) => void;
}) {
  const beamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = beamRef.current;
    if (!el) return;

    function handleAnimationIteration() {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const parentRect = el.parentElement?.getBoundingClientRect();
      if (parentRect) {
        onCollision(rect.left - parentRect.left + rect.width / 2);
      }
    }

    el.addEventListener("animationiteration", handleAnimationIteration);
    return () => {
      el.removeEventListener("animationiteration", handleAnimationIteration);
    };
  }, [onCollision]);

  return (
    <div
      ref={beamRef}
      className="absolute top-0"
      style={{
        left: config.left,
        width: `${config.width}px`,
        height: "120%",
        transform: `rotate(${config.angle}deg)`,
        opacity: 0,
        animation: `beam-fall ${config.duration}s ${config.delay}s ease-in infinite`,
        background: `linear-gradient(
          180deg,
          oklch(0.80 0.16 ${85 + config.hueShift} / 0%) 0%,
          oklch(0.80 0.16 ${85 + config.hueShift} / ${config.opacity * 100}%) 30%,
          oklch(0.75 0.14 ${85 + config.hueShift} / ${config.opacity * 80}%) 60%,
          oklch(0.80 0.16 ${85 + config.hueShift} / 0%) 100%
        )`,
      }}
    />
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export function BackgroundBeams({
  className,
  children,
  beamCount = 6,
  particleCount = 18,
}: BackgroundBeamsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [beams] = useState(() => generateBeams(beamCount));
  const particleIdRef = useRef(0);

  const spawnParticles = useCallback(
    (x: number) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const bottomY = rect.height;

      const newParticles: Particle[] = Array.from(
        { length: particleCount },
        () => {
          const angle = -Math.PI * Math.random();
          const speed = 0.3 + Math.random() * 0.7;
          particleIdRef.current += 1;
          return {
            id: `p-${particleIdRef.current}`,
            x: x + (Math.random() - 0.5) * 20,
            y: bottomY - 4,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 2 + Math.random() * 4,
            opacity: 0.5 + Math.random() * 0.5,
            hue: -15 + Math.random() * 30,
            duration: 0.6 + Math.random() * 0.4,
          };
        }
      );

      setParticles((prev) => {
        const combined = [...prev, ...newParticles];
        // Cap at 100 particles to prevent memory buildup
        return combined.slice(-100);
      });

      // Clean up after animation completes
      setTimeout(() => {
        setParticles((prev) =>
          prev.filter((p) => !newParticles.some((np) => np.id === p.id))
        );
      }, 1200);
    },
    [particleCount]
  );

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
    >
      {/* Beam layer — pointer-events-none for pure decoration */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        {beams.map((beam) => (
          <Beam key={beam.id} config={beam} onCollision={spawnParticles} />
        ))}

        {/* Collision particles */}
        <CollisionZone particles={particles} />

        {/* Ambient gold glow at the bottom */}
        <div
          className="absolute inset-x-0 bottom-0 h-32"
          style={{
            background:
              "radial-gradient(ellipse at 50% 100%, oklch(0.80 0.16 85 / 8%) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Content renders on top */}
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}
