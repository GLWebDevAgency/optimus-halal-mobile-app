/**
 * Logger — In-memory log collector with console output
 *
 * Collects logs in memory so they can be displayed in a debug overlay
 * on preview/production builds where Metro console isn't available.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  tag: string;
  message: string;
  data?: unknown;
}

const MAX_ENTRIES = 200;
const entries: LogEntry[] = [];
const listeners: Set<() => void> = new Set();

function addEntry(level: LogLevel, tag: string, message: string, data?: unknown) {
  const entry: LogEntry = {
    timestamp: Date.now(),
    level,
    tag,
    message,
    data,
  };

  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.shift();

  // Always mirror to console for adb logcat / Xcode console
  const prefix = `[${tag}]`;
  switch (level) {
    case "error":
      console.error(prefix, message, data ?? "");
      break;
    case "warn":
      console.warn(prefix, message, data ?? "");
      break;
    default:
      console.log(prefix, message, data ?? "");
  }

  // Notify listeners (debug overlay)
  listeners.forEach((fn) => fn());
}

export const logger = {
  debug: (tag: string, message: string, data?: unknown) =>
    addEntry("debug", tag, message, data),
  info: (tag: string, message: string, data?: unknown) =>
    addEntry("info", tag, message, data),
  warn: (tag: string, message: string, data?: unknown) =>
    addEntry("warn", tag, message, data),
  error: (tag: string, message: string, data?: unknown) =>
    addEntry("error", tag, message, data),

  /** Get all collected log entries */
  getEntries: (): readonly LogEntry[] => entries,

  /** Get formatted text for display */
  getFormattedLogs: (): string => {
    return entries
      .map((e) => {
        const time = new Date(e.timestamp).toISOString().slice(11, 23);
        const dataStr = e.data !== undefined ? ` ${JSON.stringify(e.data)}` : "";
        return `${time} [${e.level.toUpperCase()}] ${e.tag}: ${e.message}${dataStr}`;
      })
      .join("\n");
  },

  /** Subscribe to new log entries */
  subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  /** Clear all entries */
  clear: () => {
    entries.length = 0;
    listeners.forEach((fn) => fn());
  },
};
