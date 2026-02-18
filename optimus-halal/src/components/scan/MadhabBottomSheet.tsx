/**
 * MadhabBottomSheet — Premium sliding modal for madhab opinion details.
 *
 * Triggered when user taps a non-halal madhab badge on the scan result.
 * Slides from bottom with backdrop dim, shows:
 * - School name + verdict badge
 * - List of conflicting additives with explanations
 * - Scholarly references
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Pressable,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
  useReducedMotion,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ConflictingAdditive {
  code: string;
  name: string;
  ruling: string;
  explanation: string;
  scholarlyReference: string | null;
}

interface MadhabBottomSheetProps {
  visible: boolean;
  madhab: string;
  madhabLabel: string;
  status: "halal" | "doubtful" | "haram";
  conflictingAdditives: ConflictingAdditive[];
  onClose: () => void;
}

const STATUS_COLORS = {
  halal: "#22c55e",
  doubtful: "#f97316",
  haram: "#ef4444",
} as const;

const STATUS_ICONS = {
  halal: "check-circle" as const,
  doubtful: "help" as const,
  haram: "cancel" as const,
};

export const MadhabBottomSheet = React.memo(function MadhabBottomSheet({
  visible,
  madhab,
  madhabLabel,
  status,
  conflictingAdditives,
  onClose,
}: MadhabBottomSheetProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  // Keep component mounted during close animation
  const [isMounted, setIsMounted] = useState(false);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      backdropOpacity.value = withTiming(1, { duration: 200 });
      translateY.value = reducedMotion
        ? 0
        : withSpring(0, { damping: 20, stiffness: 200 });
    } else if (isMounted) {
      backdropOpacity.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(
        SCREEN_HEIGHT,
        { duration: 250, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(setIsMounted)(false);
        }
      );
    }
  }, [visible, reducedMotion, translateY, backdropOpacity, isMounted]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const statusColor = STATUS_COLORS[status];
  const statusIcon = STATUS_ICONS[status];

  if (!isMounted) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: isDark ? "#0f1a12" : "#ffffff",
            paddingBottom: insets.bottom + 20,
          },
          sheetStyle,
        ]}
      >
        {/* Drag handle */}
        <View style={styles.handleContainer}>
          <View
            style={[
              styles.handle,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(0,0,0,0.12)",
              },
            ]}
          />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: `${statusColor}20`, borderColor: statusColor },
              ]}
            >
              <MaterialIcons name={statusIcon} size={20} color={statusColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                {t.scanResult.madhabDiffersTitle.replace("{{madhab}}", madhabLabel)}
              </Text>
              <Text style={[styles.headerSubtitle, { color: statusColor }]}>
                {status === "halal"
                  ? t.scanResult.halal
                  : status === "doubtful"
                    ? t.scanResult.doubtful
                    : t.scanResult.haram}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[
              styles.closeButton,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(0,0,0,0.04)",
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t.common.close}
          >
            <MaterialIcons
              name="close"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Additive list — scrollable for many items */}
        {conflictingAdditives.length > 0 ? (
          <ScrollView
            style={styles.content}
            contentContainerStyle={{ paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text
              style={[styles.sectionLabel, { color: colors.textSecondary }]}
            >
              {t.scanResult.madhabConflictExplain}
            </Text>
            {conflictingAdditives.map((add) => (
              <View
                key={add.code}
                style={[
                  styles.additiveCard,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(0,0,0,0.02)",
                    borderColor: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.06)",
                  },
                ]}
              >
                <View style={styles.additiveHeader}>
                  <Text
                    style={[styles.additiveCode, { color: colors.textPrimary }]}
                  >
                    {add.code}
                  </Text>
                  <Text
                    style={[styles.additiveName, { color: colors.textSecondary }]}
                  >
                    {add.name}
                  </Text>
                  <View
                    style={[
                      styles.rulingBadge,
                      {
                        backgroundColor:
                          `${STATUS_COLORS[add.ruling as keyof typeof STATUS_COLORS] ?? "#6b7280"}15`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.rulingText,
                        {
                          color:
                            STATUS_COLORS[add.ruling as keyof typeof STATUS_COLORS] ??
                            "#6b7280",
                        },
                      ]}
                    >
                      {add.ruling === "haram"
                        ? t.scanResult.haram
                        : add.ruling === "doubtful"
                          ? t.scanResult.doubtful
                          : t.scanResult.halal}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.additiveExplanation,
                    { color: colors.textSecondary },
                  ]}
                >
                  {add.explanation}
                </Text>
                {add.scholarlyReference && (
                  <View style={styles.refRow}>
                    <MaterialIcons
                      name="menu-book"
                      size={12}
                      color={colors.textMuted}
                    />
                    <Text
                      style={[styles.refText, { color: colors.textMuted }]}
                    >
                      {add.scholarlyReference}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.content}>
            <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
              {t.scanResult.madhabNoData}
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  statusDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
    textTransform: "uppercase",
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  additiveCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  additiveHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  additiveCode: {
    fontSize: 14,
    fontWeight: "800",
  },
  additiveName: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  rulingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rulingText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  additiveExplanation: {
    fontSize: 13,
    lineHeight: 19,
  },
  refRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  refText: {
    fontSize: 11,
    fontStyle: "italic",
  },
  noDataText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
  },
});

export default MadhabBottomSheet;
