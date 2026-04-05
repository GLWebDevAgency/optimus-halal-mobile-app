import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Naqiy",
  slug: "optimus-halal",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  scheme: "naqiy",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#0C0C0C",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.naqiy.app",
    infoPlist: {
      NSCameraUsageDescription:
        "Naqiy utilise la caméra pour scanner les codes-barres des produits.",
      NSFaceIDUsageDescription:
        "Utilisez Face ID pour une connexion sécurisée.",
      NSLocationWhenInUseUsageDescription:
        "Naqiy utilise votre localisation pour trouver les points de vente à proximité.",
      NSPhotoLibraryUsageDescription:
        "Accédez à votre galerie pour scanner un code-barres depuis une photo existante.",
    },
  },
  android: {
    package: "com.naqiy.app",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#f3f1ed",
    },
    edgeToEdgeEnabled: true,
    permissions: [
      "android.permission.CAMERA",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.USE_BIOMETRIC",
      "android.permission.USE_FINGERPRINT",
    ],
  },
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro",
  },
  plugins: [
    "./plugins/withAndroidApkOptimization",
    "expo-router",
    [
      "expo-camera",
      {
        cameraPermission:
          "Naqiy utilise la caméra pour scanner les codes-barres.",
      },
    ],
    [
      "expo-local-authentication",
      {
        faceIDPermission: "Permet l'authentification par Face ID.",
      },
    ],
    "expo-secure-store",
    "expo-font",
    [
      "@sentry/react-native",
      {
        organization: "limame-ghassene",
        project: "naqiy",
      },
    ],
    "@rnmapbox/maps",
    "expo-video",
    [
      "expo-system-ui",
      {
        backgroundColor: "#0C0C0C",
      },
    ],
    // Android push notification channel for conversion nudges
    [
      "expo-notifications",
      {
        androidChannels: [
          {
            name: "naqiy_nudge",
            importance: "high",
            description: "Notifications Naqiy+",
            vibrationPattern: [0, 250, 250, 250],
          },
        ],
      },
    ],
  ],
  // appVersion policy: runtime version = app version (1.0.0).
  // Stable across JS-only changes → OTA updates work without rebuilds.
  // Only bumping version in app.config triggers a new runtime version.
  // "fingerprint" was causing EAS build failures on every dep/plugin change.
  runtimeVersion: {
    policy: "appVersion",
  },
  updates: {
    url: "https://u.expo.dev/74c0f55e-ea1c-4786-93a7-de4b27280104",
  },
  extra: {
    eas: {
      projectId: "74c0f55e-ea1c-4786-93a7-de4b27280104",
    },
    router: {},
  },
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  owner: "gl.dev",
});
