/**
 * Profile Screen Skeleton
 * Mirrors the layout: avatar, name, stats row, menu items
 * Renders PremiumBackground behind to prevent flash on transition
 */

import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Skeleton } from "@/components/ui/Skeleton";
import { PremiumBackground } from "@/components/ui";

export function ProfileSkeleton() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1" style={{ paddingTop: insets.top + 16 }}>
      <PremiumBackground noOrb />

      {/* Header */}
      <View className="items-center px-5 mb-6">
        <Skeleton width={88} height={88} borderRadius={44} />
        <Skeleton width={160} height={20} borderRadius={4} style={{ marginTop: 12 }} />
        <Skeleton width={120} height={14} borderRadius={4} style={{ marginTop: 6 }} />
      </View>

      {/* Stats row */}
      <View className="flex-row justify-around px-5 mb-8">
        {[0, 1, 2].map((i) => (
          <View key={i} className="items-center gap-2">
            <Skeleton width={40} height={24} borderRadius={4} />
            <Skeleton width={60} height={12} borderRadius={4} />
          </View>
        ))}
      </View>

      {/* Menu items */}
      <View className="px-5 gap-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View key={i} className="flex-row items-center gap-3 py-3">
            <Skeleton width={40} height={40} borderRadius={12} />
            <View className="flex-1">
              <Skeleton width="70%" height={16} borderRadius={4} />
              <Skeleton width="40%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
            </View>
            <Skeleton width={20} height={20} borderRadius={4} />
          </View>
        ))}
      </View>
    </View>
  );
}
