import type { StateStorage } from "zustand/middleware";
import { logger } from "./logger";

let mmkvInstance: any = null;

try {
  const { createMMKV } = require("react-native-mmkv");
  mmkvInstance = createMMKV({ id: "naqiy" });
  logger.info("Storage", "MMKV initialized OK");
} catch (e) {
  logger.warn("Storage", "MMKV failed, falling back to in-memory", String(e));
}

/**
 * In-memory fallback if MMKV fails (Expo Go, broken JSI, etc.)
 */
const memoryStore = new Map<string, string>();

export const mmkvStorage: StateStorage = {
  getItem(name: string) {
    if (mmkvInstance) {
      try {
        return mmkvInstance.getString(name) ?? null;
      } catch {
        return memoryStore.get(name) ?? null;
      }
    }
    return memoryStore.get(name) ?? null;
  },
  setItem(name: string, value: string) {
    if (mmkvInstance) {
      try {
        mmkvInstance.set(name, value);
        return;
      } catch {
        // fallthrough to memory
      }
    }
    memoryStore.set(name, value);
  },
  removeItem(name: string) {
    if (mmkvInstance) {
      try {
        mmkvInstance.remove(name);
        return;
      } catch {
        // fallthrough to memory
      }
    }
    memoryStore.delete(name);
  },
};
