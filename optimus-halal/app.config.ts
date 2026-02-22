import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Naqiy",
  slug: "naqiy",
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
    },
  },
  android: {
    package: "com.naqiy.app",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0C0C0C",
    },
    edgeToEdgeEnabled: true,
    permissions: [
      "android.permission.CAMERA",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.USE_BIOMETRIC",
      "android.permission.RECORD_AUDIO",
      "android.permission.USE_FINGERPRINT",
    ],
  },
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro",
  },
  plugins: [
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
  ],
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
