/**
 * Alerts Screen Skeleton
 * Mirrors the timeline layout: filter chips + alert cards.
 * Uses PremiumBackground for seamless dark-mode transition.
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Skeleton } from "@/components/ui/Skeleton";
import { PremiumBackground } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";

export function AlertsSkeleton() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PremiumBackground noOrb />

      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20 }}>
        {/* Filter chips row */}
        <View style={styles.chipsRow}>
          <Skeleton width={72} height={32} borderRadius={16} />
          <Skeleton width={88} height={32} borderRadius={16} />
          <Skeleton width={64} height={32} borderRadius={16} />
        </View>

        {/* Timeline cards */}
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.timelineRow}>
            {/* Timeline icon */}
            <View style={styles.timelineIconCol}>
              <Skeleton width={48} height={48} borderRadius={24} />
              {i < 2 && (
                <View style={[styles.timelineLine, { backgroundColor: colors.borderLight }]} />
              )}
            </View>

            {/* Card content */}
            <View style={styles.cardCol}>
              <View style={styles.cardHeader}>
                <Skeleton width={100} height={18} borderRadius={6} />
                <Skeleton width={56} height={14} borderRadius={4} />
              </View>
              <Skeleton width="100%" height={140} borderRadius={16} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  timelineRow: {
    flexDirection: "row",
    marginBottom: 24,
  },
  timelineIconCol: {
    alignItems: "center",
    width: 56,
    paddingTop: 4,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    marginTop: 8,
    borderRadius: 1,
    minHeight: 60,
  },
  cardCol: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
});
