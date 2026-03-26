/**
 * Converts a hex color + alpha to an rgba() string.
 * @param hex - e.g. "#22c55e"
 * @param alpha - 0–1
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
