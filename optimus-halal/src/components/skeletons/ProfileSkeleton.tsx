/**
 * Profile Screen Skeleton
 * Mirrors the layout: avatar, name, stats row, menu items.
 * Uses PremiumBackground for seamless dark-mode transition.
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Skeleton } from "@/components/ui/Skeleton";
import { PremiumBackground } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";

export function ProfileSkeleton() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PremiumBackground noOrb />

      <View style={{ paddingTop: insets.top + 16 }}>
        {/* Header — avatar + name */}
        <View style={styles.avatarSection}>
          <Skeleton width={88} height={88} borderRadius={44} />
          <Skeleton width={160} height={20} borderRadius={6} style={{ marginTop: 12 }} />
          <Skeleton width={120} height={14} borderRadius={4} style={{ marginTop: 6 }} />
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.statItem}>
              <Skeleton width={40} height={24} borderRadius={6} />
              <Skeleton width={60} height={12} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>

        {/* Menu items */}
        <View style={styles.menuSection}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.menuRow}>
              <Skeleton width={40} height={40} borderRadius={12} />
              <View style={styles.menuText}>
                <Skeleton width="70%" height={16} borderRadius={4} />
                <Skeleton width="40%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
              </View>
              <Skeleton width={20} height={20} borderRadius={4} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  avatarSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  statItem: {
    alignItems: "center",
  },
  menuSection: {
    paddingHorizontal: 20,
    gap: 12,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  menuText: {
    flex: 1,
  },
});
