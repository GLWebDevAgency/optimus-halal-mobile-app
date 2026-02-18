/**
 * useRamadanMode — Seasonal Ramadan theme detection.
 *
 * Auto-detects Ramadan period from a hardcoded date table
 * (Islamic calendar shifts ~11 days/year — JS libraries are unreliable).
 * Users can manually override via settings.
 *
 * Returns `isRamadan` boolean + `setOverride` for settings toggle.
 */

import { useEffect, useMemo, useState } from "react";
import { useRamadanStore } from "@/store";

// Approximate Ramadan start/end dates (Gregorian) for upcoming years.
// Source: astronomical calculations — actual dates depend on moon sighting.
const RAMADAN_DATES: Array<{ year: number; start: [number, number]; end: [number, number] }> = [
  { year: 2026, start: [2, 18], end: [3, 19] },   // Feb 18 – Mar 19
  { year: 2027, start: [2, 8],  end: [3, 9] },     // Feb 8 – Mar 9
  { year: 2028, start: [1, 28], end: [2, 26] },    // Jan 28 – Feb 26
  { year: 2029, start: [1, 16], end: [2, 14] },    // Jan 16 – Feb 14
  { year: 2030, start: [1, 6],  end: [2, 4] },     // Jan 6 – Feb 4
];

function isWithinRamadan(now: Date): boolean {
  const year = now.getFullYear();
  const entry = RAMADAN_DATES.find((d) => d.year === year);
  if (!entry) return false;

  const start = new Date(year, entry.start[0] - 1, entry.start[1]);
  const end = new Date(year, entry.end[0] - 1, entry.end[1], 23, 59, 59);
  return now >= start && now <= end;
}

export const useRamadanMode = () => {
  const manualOverride = useRamadanStore((s) => s.manualOverride);
  const setManualOverride = useRamadanStore((s) => s.setManualOverride);

  // Re-evaluate daily so an app kept open across midnight picks up changes
  const [today, setToday] = useState(() => new Date().toDateString());
  useEffect(() => {
    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() -
      now.getTime() +
      1000; // +1s buffer
    const timer = setTimeout(() => setToday(new Date().toDateString()), msUntilMidnight);
    return () => clearTimeout(timer);
  }, [today]);

  const isRamadan = useMemo(() => {
    if (manualOverride !== null) return manualOverride;
    return isWithinRamadan(new Date());
  }, [manualOverride, today]);

  return {
    isRamadan,
    /** null = auto-detect, true = force on, false = force off */
    setOverride: setManualOverride,
    manualOverride,
  };
};
