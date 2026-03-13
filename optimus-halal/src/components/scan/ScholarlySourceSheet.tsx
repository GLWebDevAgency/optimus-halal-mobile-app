/**
 * ScholarlySourceSheet — BottomSheet for scholarly source detail.
 *
 * Displays the scholarly_reference TEXT string from ingredient_rulings
 * in a formatted blockquote with gold left border.
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
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
import { BookOpenIcon, XIcon } from "phosphor-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { gold } from "@/theme/colors";
import { darkTheme, lightTheme } from "@/theme/colors";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ScholarlySourceSheetProps {
  visible: boolean;
  sourceRef: string | null;
  onClose: () => void;
}

export const ScholarlySourceSheet = React.memo(function ScholarlySourceSheet({
  visible,
  sourceRef,
  onClose,
}: ScholarlySourceSheetProps) {
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
        : withSpring(0, { damping: 28, stiffness: 120 });
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
            backgroundColor: isDark
              ? darkTheme.background
              : lightTheme.backgroundSecondary,
            paddingBottom: insets.bottom + 24,
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
                styles.iconContainer,
                {
                  backgroundColor: isDark
                    ? "rgba(212,175,55,0.12)"
                    : "rgba(212,175,55,0.10)",
                },
              ]}
            >
              <BookOpenIcon size={20} color={gold[500]} />
            </View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {t.scanResult.scholarlySourceTitle}
            </Text>
          </View>
          <Pressable
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
            <XIcon size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Scrollable content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {sourceRef ? (
            <>
              {/* Blockquote with gold left border */}
              <View
                style={[
                  styles.blockquote,
                  {
                    borderLeftColor: gold[500],
                    backgroundColor: isDark
                      ? "rgba(212,175,55,0.06)"
                      : "rgba(212,175,55,0.05)",
                  },
                ]}
              >
                <Text
                  style={[styles.referenceText, { color: colors.textPrimary }]}
                >
                  {sourceRef}
                </Text>
              </View>

              {/* Muted footer */}
              <Text style={[styles.footerText, { color: colors.textMuted }]}>
                {t.scanResult.scholarlySourceFooter}
              </Text>
            </>
          ) : (
            <Text
              style={[styles.emptyText, { color: colors.textSecondary }]}
            >
              {t.scanResult.scholarlySourceEmpty}
            </Text>
          )}
        </ScrollView>
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
    maxHeight: SCREEN_HEIGHT * 0.5,
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
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
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
  blockquote: {
    borderLeftWidth: 3,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  referenceText: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: "italic",
  },
  footerText: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
  },
});

export default ScholarlySourceSheet;
