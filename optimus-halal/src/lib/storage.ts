import { createMMKV } from "react-native-mmkv";
import type { MMKV } from "react-native-mmkv";
import type { StateStorage } from "zustand/middleware";

export const mmkv: MMKV = createMMKV({ id: "optimus-halal" });

export const mmkvStorage: StateStorage = {
  getItem(name: string) {
    const value = mmkv.getString(name);
    return value ?? null;
  },
  setItem(name: string, value: string) {
    mmkv.set(name, value);
  },
  removeItem(name: string) {
    mmkv.remove(name);
  },
};
