import { Platform } from "react-native";

/**
 * Sets the Android navigation bar theme colors.
 *
 * Since Expo SDK 54 / Android 15+ with edge-to-edge enabled,
 * `setBackgroundColorAsync` is no longer supported (the system
 * draws behind the nav bar). We only set the button style (light/dark)
 * which remains supported and controls icon contrast.
 */
export function setNavigationBarTheme(isDark: boolean) {
  if (Platform.OS !== "android") return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const NavigationBar = require("expo-navigation-bar");
    // setBackgroundColorAsync is not supported with edge-to-edge — skip it.
    // Only setButtonStyleAsync is needed (controls nav bar icon contrast).
    NavigationBar.setButtonStyleAsync(isDark ? "light" : "dark").catch(() => {});
  } catch {
    // expo-navigation-bar requires a dev client — gracefully skip in Expo Go
  }
}
