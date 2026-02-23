/**
 * Ultra Premium Product Scanner Screen
 * 
 * Design inspiré du template avec:
 * - Plein écran immersif sans TabBar
 * - Cadre de scan avec corners lumineux
 * - Ligne de scan animée avec glow
 * - Effets premium (halos, blur, gradients)
 * - Bouton capture central avec halo pulsant
 * - Boutons Galerie et Historique
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Alert,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useHaptics, useTheme } from "@/hooks";
import { ImpactFeedbackStyle } from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  cancelAnimation,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  interpolate,
  useReducedMotion,
} from "react-native-reanimated";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

import { useTranslation } from "@/hooks/useTranslation";
import { PressableScale } from "@/components/ui/PressableScale";
import { brand } from "@/theme/colors";

const GOLD = "#d4af37";
const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SCAN_FRAME_WIDTH = 320;
const SCAN_FRAME_HEIGHT = 288;
const CORNER_SIZE = 48;
const CORNER_THICKNESS = 4;

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { impact, notification } = useHaptics();
  const { t } = useTranslation();
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [scanned, setScanned] = useState(false);

  const reducedMotion = useReducedMotion();

  // Animation values
  const scanLinePosition = useSharedValue(0);
  const cornerGlow = useSharedValue(0.3);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.5);
  const buttonScale = useSharedValue(1);

  // Scan line animation (disabled when user prefers reduced motion)
  useEffect(() => {
    if (reducedMotion) return;
    scanLinePosition.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    return () => cancelAnimation(scanLinePosition);
  }, [reducedMotion]);

  // Corner glow pulsing
  useEffect(() => {
    if (reducedMotion) return;
    cornerGlow.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    return () => cancelAnimation(cornerGlow);
  }, [reducedMotion]);

  // Button pulse animation
  useEffect(() => {
    if (reducedMotion) return;
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.25, { duration: 1200 }),
        withTiming(0.5, { duration: 1200 })
      ),
      -1,
      false
    );
    return () => {
      cancelAnimation(pulseScale);
      cancelAnimation(pulseOpacity);
    };
  }, [reducedMotion]);

  const animatedScanLineStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scanLinePosition.value, [0, 1], [0, SCAN_FRAME_HEIGHT - 4]) },
    ],
    opacity: interpolate(scanLinePosition.value, [0, 0.5, 1], [0.6, 1, 0.6]),
  }));

  const animatedCornerGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: cornerGlow.value,
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleToggleFlash = useCallback(async () => {
    impact();
    setIsFlashOn((prev) => !prev);
  }, []);

  const handleClose = useCallback(async () => {
    impact();
    router.back();
  }, []);

  const processScan = useCallback(
    async (barcode: string) => {
      if (scanned) return;

      setScanned(true);
      setIsScanning(false);
      // Barcode detected — medium impact for the "discovery moment"
      impact(ImpactFeedbackStyle.Medium);

      router.push({
        pathname: "/scan-result",
        params: { barcode },
      });

      setTimeout(() => {
        setScanned(false);
        setIsScanning(true);
      }, 2000);
    },
    [scanned, impact]
  );

  const handleOpenGallery = useCallback(async () => {
    impact();
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(t.scanner.noPermission, t.scanner.cameraPermissionDesc);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        if (__DEV__) {
          processScan("3760020507350");
          return;
        }
        Alert.alert(t.scanner.title, t.scanner.galleryComingSoon);
      }
    } catch (error) {
      console.error("[Scanner] Gallery error:", error);
      Alert.alert(t.scanner.noPermission, t.scanner.cameraPermissionDesc);
    }
  }, [processScan, impact, t]);

  const handleOpenHistory = useCallback(async () => {
    impact();
    router.push("/settings/scan-history");
  }, [impact]);

  const handleBarcodeScanned = useCallback(
    ({ data, type }: { data: string; type: string }) => {
      if (scanned || !isScanning) return;
      processScan(data);
    },
    [scanned, isScanning, processScan]
  );

  const handleCapture = useCallback(async () => {
    buttonScale.value = withSequence(
      withSpring(0.85, { damping: 8, stiffness: 400 }),
      withSpring(1.05, { damping: 10, stiffness: 300 }),
      withSpring(1, { damping: 12, stiffness: 200 })
    );
    impact(ImpactFeedbackStyle.Heavy);

    if (__DEV__) {
      processScan("3760020507350");
      return;
    }
    // Production: auto-scan via onBarcodeScanned, bouton = feedback haptique
    notification();
  }, [processScan, notification, impact]);

  // Permission not loaded yet
  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <Text style={styles.loadingText}>{t.scanner.scanning}</Text>
      </View>
    );
  }

  // Permission not granted
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <StatusBar style="light" />
        <Animated.View
          entering={FadeInDown.delay(200).duration(600)}
          style={styles.permissionContent}
        >
          <View style={styles.permissionIconContainer}>
            <MaterialIcons name="camera-alt" size={48} color={GOLD} />
          </View>
          <View style={styles.permissionTextContainer}>
            <Text style={styles.permissionTitle}>{t.scanner.noPermission}</Text>
            <Text style={styles.permissionDescription}>
              {t.scanner.cameraPermissionDesc}
            </Text>
          </View>
          <PressableScale
            onPress={requestPermission}
            style={styles.permissionButton}
            accessibilityRole="button"
            accessibilityLabel={t.scanner.allowCamera}
          >
            <Text style={styles.permissionButtonText}>{t.scanner.enableCamera}</Text>
          </PressableScale>
          <PressableScale onPress={handleClose} style={styles.cancelButton} accessibilityRole="button" accessibilityLabel={t.common.cancel}>
            <Text style={styles.cancelButtonText}>{t.common.cancel}</Text>
          </PressableScale>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Camera View - Full Screen */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={isFlashOn}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39", "qr"],
        }}
        onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
      />

      {/* Dark Overlay Mask with Cutout */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {/* Top overlay */}
        {Platform.OS === "ios" ? (
          <BlurView intensity={5} tint="dark" style={[styles.overlaySection, { height: (SCREEN_HEIGHT - SCAN_FRAME_HEIGHT) / 2 }]}>
            <View style={styles.overlayDark} />
          </BlurView>
        ) : (
          <View style={[styles.overlaySection, { height: (SCREEN_HEIGHT - SCAN_FRAME_HEIGHT) / 2 }]}>
            <View style={styles.overlayDark} />
          </View>
        )}

        {/* Middle row with cutout */}
        <View style={[styles.middleRow, { height: SCAN_FRAME_HEIGHT }]}>
          {/* Left overlay */}
          {Platform.OS === "ios" ? (
            <BlurView intensity={5} tint="dark" style={styles.sideOverlay}>
              <View style={styles.overlayDark} />
            </BlurView>
          ) : (
            <View style={styles.sideOverlay}>
              <View style={styles.overlayDark} />
            </View>
          )}

          {/* Transparent Scan Frame */}
          <View style={styles.scanFrame}>
            {/* Corner Brackets with Glow */}
            <Animated.View style={[styles.corner, styles.cornerTopLeft, animatedCornerGlowStyle]} />
            <Animated.View style={[styles.corner, styles.cornerTopRight, animatedCornerGlowStyle]} />
            <Animated.View style={[styles.corner, styles.cornerBottomLeft, animatedCornerGlowStyle]} />
            <Animated.View style={[styles.corner, styles.cornerBottomRight, animatedCornerGlowStyle]} />

            {/* Animated Scan Line */}
            <Animated.View style={[styles.scanLine, animatedScanLineStyle]}>
              <LinearGradient
                colors={["transparent", colors.primary, "transparent"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.scanLineGradient}
              />
            </Animated.View>
          </View>

          {/* Right overlay */}
          {Platform.OS === "ios" ? (
            <BlurView intensity={5} tint="dark" style={styles.sideOverlay}>
              <View style={styles.overlayDark} />
            </BlurView>
          ) : (
            <View style={styles.sideOverlay}>
              <View style={styles.overlayDark} />
            </View>
          )}
        </View>

        {/* Bottom overlay */}
        {Platform.OS === "ios" ? (
          <BlurView intensity={5} tint="dark" style={[styles.overlaySection, { flex: 1 }]}>
            <View style={styles.overlayDark} />
          </BlurView>
        ) : (
          <View style={[styles.overlaySection, { flex: 1 }]}>
            <View style={styles.overlayDark} />
          </View>
        )}
      </View>

      {/* UI Controls Layer */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        {/* Header with gradient */}
        <LinearGradient
          colors={["rgba(0,0,0,0.85)", "rgba(0,0,0,0.4)", "transparent"]}
          style={[styles.header, { paddingTop: insets.top + 12 }]}
        >
          {/* Close Button */}
          <Animated.View entering={FadeIn.delay(200).duration(400)}>
            <PressableScale
              onPress={handleClose}
              style={styles.headerButton}
              accessibilityRole="button"
              accessibilityLabel={t.common.close}
            >
              <MaterialIcons name="close" size={20} color="#ffffff" />
            </PressableScale>
          </Animated.View>

          {/* App Title Badge */}
          <Animated.View entering={FadeIn.delay(300).duration(400)} style={styles.titleBadge}>
            <MaterialIcons name="verified-user" size={18} color={GOLD} />
            <Text style={styles.titleText}>{t.scanner.halalScanner}</Text>
          </Animated.View>

          {/* Flash Toggle */}
          <Animated.View entering={FadeIn.delay(200).duration(400)}>
            <PressableScale
              onPress={handleToggleFlash}
              style={[styles.headerButton, isFlashOn && styles.headerButtonActive]}
              accessibilityRole="button"
              accessibilityLabel={t.scanner.flash}
            >
              <MaterialIcons
                name={isFlashOn ? "flash-on" : "flash-off"}
                size={20}
                color={isFlashOn ? GOLD : "#ffffff"}
              />
            </PressableScale>
          </Animated.View>
        </LinearGradient>

        {/* Instruction Text Below Frame */}
        <Animated.View
          entering={FadeIn.delay(600).duration(500)}
          style={[styles.instructionContainer, { top: (SCREEN_HEIGHT + SCAN_FRAME_HEIGHT) / 2 + 24 }]}
          pointerEvents="none"
        >
          {Platform.OS === "ios" ? (
            <BlurView intensity={40} tint="dark" style={styles.instructionBlur}>
              <Text style={styles.instructionText}>{t.scanner.instruction}</Text>
            </BlurView>
          ) : (
            <View style={[styles.instructionBlur, { backgroundColor: "rgba(0,0,0,0.65)" }]}>
              <Text style={styles.instructionText}>{t.scanner.instruction}</Text>
            </View>
          )}
        </Animated.View>

        {/* Bottom Control Dock */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)", "rgba(0,0,0,0.95)"]}
          style={[styles.bottomDock, { paddingBottom: insets.bottom + 24 }]}
        >
          <View style={styles.controlsRow}>
            {/* Gallery Button */}
            <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.sideButtonContainer}>
              <PressableScale
                onPress={handleOpenGallery}
                style={styles.sideButton}
                accessibilityRole="button"
                accessibilityLabel={t.scanner.gallery}
              >
                <MaterialIcons name="photo-library" size={26} color={GOLD} />
              </PressableScale>
              <Text style={styles.sideButtonLabel}>{t.scanner.gallery.toUpperCase()}</Text>
            </Animated.View>

            {/* Main Capture Button */}
            <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.captureButtonContainer}>
              {/* Pulsing Glow */}
              <Animated.View style={[styles.captureGlow, animatedPulseStyle]}>
                <LinearGradient
                  colors={[`${colors.primary}40`, `${colors.primary}00`]}
                  style={styles.captureGlowGradient}
                />
              </Animated.View>

              {/* Outer Ring */}
              <View style={styles.captureOuterRing}>
                {/* Inner Button */}
                <Animated.View style={animatedButtonStyle}>
                  <PressableScale
                    onPress={handleCapture}
                    style={styles.captureButton}
                    accessibilityRole="button"
                    accessibilityLabel={t.scanner.title}
                  >
                    <MaterialIcons name="qr-code-scanner" size={36} color={colors.textPrimary} />
                  </PressableScale>
                </Animated.View>
              </View>
            </Animated.View>

            {/* History Button */}
            <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.sideButtonContainer}>
              <PressableScale
                onPress={handleOpenHistory}
                style={styles.sideButton}
                accessibilityRole="button"
                accessibilityLabel={t.scanner.history}
              >
                <MaterialIcons name="history" size={26} color={GOLD} />
              </PressableScale>
              <Text style={styles.sideButtonLabel}>{t.scanner.history.toUpperCase()}</Text>
            </Animated.View>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: "#0C0C0C",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  permissionContent: {
    alignItems: "center",
    gap: 24,
  },
  permissionIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(212,175,55,0.1)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  permissionTextContainer: {
    alignItems: "center",
    gap: 8,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  permissionDescription: {
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: GOLD,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0C0C0C",
  },
  cancelButton: {
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
  },
  overlaySection: {
    width: "100%",
    overflow: "hidden",
  },
  overlayDark: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(12,12,12,0.65)",
  },
  middleRow: {
    flexDirection: "row",
  },
  sideOverlay: {
    flex: 1,
    overflow: "hidden",
  },
  scanFrame: {
    width: SCAN_FRAME_WIDTH,
    height: SCAN_FRAME_HEIGHT,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.08)",
    position: "relative",
    overflow: "hidden",
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: brand.primary,
    borderWidth: CORNER_THICKNESS,
    shadowColor: brand.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 15,
    elevation: 5,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 16,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 16,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 16,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 16,
  },
  scanLine: {
    position: "absolute",
    left: "5%",
    width: "90%",
    height: 2,
  },
  scanLineGradient: {
    flex: 1,
    shadowColor: brand.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 15,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(212,175,55,0.08)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerButtonActive: {
    backgroundColor: "rgba(212,175,55,0.18)",
    borderColor: "rgba(212,175,55,0.35)",
  },
  titleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(12,12,12,0.85)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.25)",
  },
  titleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 0.5,
  },
  instructionContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  instructionBlur: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.15)",
    overflow: "hidden",
  },
  instructionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
    letterSpacing: 0.5,
  },
  bottomDock: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    maxWidth: 360,
    alignSelf: "center",
    width: "100%",
  },
  sideButtonContainer: {
    alignItems: "center",
    gap: 8,
  },
  sideButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(212,175,55,0.06)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  sideButtonLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(212,175,55,0.75)",
    letterSpacing: 1,
  },
  captureButtonContainer: {
    alignItems: "center",
    marginTop: -32,
  },
  captureGlow: {
    position: "absolute",
    width: 120,
    height: 120,
  },
  captureGlowGradient: {
    flex: 1,
    borderRadius: 60,
  },
  captureOuterRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: "rgba(212,175,55,0.25)",
    backgroundColor: "rgba(212,175,55,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: brand.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: brand.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 8,
  },
});
