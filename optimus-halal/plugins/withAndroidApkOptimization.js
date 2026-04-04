/**
 * Expo Config Plugin — Android APK Size Optimization
 *
 * Modifies gradle.properties after prebuild to:
 * 1. Restrict ABIs to arm64-v8a + armeabi-v7a (drops x86/x86_64 emulator ABIs)
 * 2. Enable R8 minification in release builds
 * 3. Enable resource shrinking in release builds
 *
 * Impact: ~80-100 MB reduction on universal APK (212 MB → ~70-80 MB)
 */

const { withGradleProperties } = require("expo/config-plugins");

module.exports = function withAndroidApkOptimization(config) {
  return withGradleProperties(config, (config) => {
    const props = config.modResults;

    // Helper to set a property (update if exists, add if not)
    function setProperty(key, value) {
      const existing = props.find((p) => p.type === "property" && p.key === key);
      if (existing) {
        existing.value = value;
      } else {
        props.push({ type: "property", key, value });
      }
    }

    // 1. ABI filter — arm64 only (99%+ of devices since 2017)
    // armeabi-v7a (arm32) causes CMake build failures with expo-modules-core
    // and represents <1% of the market. Google Play requires arm64 since Aug 2019.
    setProperty("reactNativeArchitectures", "arm64-v8a");

    // 2. R8 minification — removes unused Java/Kotlin code
    setProperty("android.enableMinifyInReleaseBuilds", "true");

    // 3. Resource shrinking — removes unused Android resources
    setProperty("android.enableShrinkResourcesInReleaseBuilds", "true");

    return config;
  });
};
