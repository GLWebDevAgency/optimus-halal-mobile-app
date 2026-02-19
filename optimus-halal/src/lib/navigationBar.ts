import { Platform } from "react-native";

/**
 * Sets the Android navigation bar theme colors.
 * Safely handles when expo-navigation-bar is unavailable (Expo Go).
 */
export function setNavigationBarTheme(isDark: boolean) {
  if (Platform.OS !== "android") return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const NavigationBar = require("expo-navigation-bar");
    NavigationBar.setBackgroundColorAsync(isDark ? "#0f1a13" : "#ffffff").catch(() => {});
    NavigationBar.setButtonStyleAsync(isDark ? "light" : "dark").catch(() => {});
  } catch {
    // expo-navigation-bar requires a dev client — gracefully skip in Expo Go
  }
}
