/**
 * Home Screen Skeleton
 * Mirrors the layout: header, impact card, quick actions, featured, favorites.
 * Uses PremiumBackground for seamless dark-mode transition.
 */

import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Skeleton } from "@/components/ui/Skeleton";
import { PremiumBackground } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HALF_CARD = (SCREEN_WIDTH - 52) / 2;

export function HomeSkeleton() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PremiumBackground noOrb />

      <View style={{ paddingTop: insets.top + 16 }}>
        {/* Header: avatar + name + bell */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Skeleton width={48} height={48} borderRadius={24} />
            <View style={{ marginLeft: 12 }}>
              <Skeleton width={60} height={12} borderRadius={4} />
              <Skeleton width={120} height={18} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
          </View>
          <Skeleton width={40} height={40} borderRadius={20} />
        </View>

        {/* Impact Card */}
        <View style={styles.section}>
          <Skeleton width="100%" height={120} borderRadius={16} />
        </View>

        {/* Quick Actions (2x2 grid) */}
        <View style={styles.section}>
          <View style={styles.gridRow}>
            <Skeleton width={HALF_CARD} height={100} borderRadius={16} />
            <Skeleton width={HALF_CARD} height={100} borderRadius={16} />
          </View>
          <View style={[styles.gridRow, { marginTop: 12 }]}>
            <Skeleton width={HALF_CARD} height={100} borderRadius={16} />
            <Skeleton width={HALF_CARD} height={100} borderRadius={16} />
          </View>
        </View>

        {/* Featured section header */}
        <View style={styles.sectionHeader}>
          <Skeleton width={100} height={18} borderRadius={6} />
          <Skeleton width={60} height={14} borderRadius={4} />
        </View>

        {/* Featured carousel */}
        <View style={styles.sectionPadded}>
          <Skeleton width={280} height={160} borderRadius={16} />
        </View>

        {/* Favorites header */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Skeleton width={100} height={18} borderRadius={6} />
          <Skeleton width={80} height={14} borderRadius={4} />
        </View>

        {/* Favorites circles */}
        <View style={styles.favoritesRow}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.favoriteItem}>
              <Skeleton width={72} height={72} borderRadius={36} />
              <Skeleton width={48} height={10} borderRadius={4} style={{ marginTop: 8 }} />
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionPadded: {
    paddingHorizontal: 20,
  },
  gridRow: {
    flexDirection: "row",
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  favoritesRow: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 20,
  },
  favoriteItem: {
    alignItems: "center",
  },
});
