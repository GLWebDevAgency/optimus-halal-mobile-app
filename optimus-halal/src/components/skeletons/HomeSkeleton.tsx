/**
 * Home Screen Skeleton
 * Mirrors the layout: header, impact card, quick actions, featured, favorites
 */

import React from "react";
import { View, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Skeleton } from "@/components/ui/Skeleton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function HomeSkeleton() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-background-light dark:bg-background-dark"
      style={{ paddingTop: insets.top + 16 }}
    >
      {/* Header: avatar + name + bell */}
      <View className="flex-row items-center justify-between px-5 mb-4">
        <View className="flex-row items-center gap-3">
          <Skeleton width={48} height={48} borderRadius={24} />
          <View>
            <Skeleton width={60} height={12} borderRadius={4} />
            <Skeleton width={120} height={18} borderRadius={4} style={{ marginTop: 6 }} />
          </View>
        </View>
        <Skeleton width={40} height={40} borderRadius={20} />
      </View>

      {/* Impact Card */}
      <View className="px-5 mb-6">
        <Skeleton width="100%" height={120} borderRadius={16} />
      </View>

      {/* Quick Actions (2x2 grid) */}
      <View className="px-5 mb-6">
        <View className="flex-row gap-3 mb-3">
          <Skeleton width={(SCREEN_WIDTH - 52) / 2} height={100} borderRadius={16} />
          <Skeleton width={(SCREEN_WIDTH - 52) / 2} height={100} borderRadius={16} />
        </View>
        <View className="flex-row gap-3">
          <Skeleton width={(SCREEN_WIDTH - 52) / 2} height={100} borderRadius={16} />
          <Skeleton width={(SCREEN_WIDTH - 52) / 2} height={100} borderRadius={16} />
        </View>
      </View>

      {/* Featured section header */}
      <View className="flex-row items-center justify-between px-5 mb-3">
        <Skeleton width={100} height={18} borderRadius={4} />
        <Skeleton width={60} height={14} borderRadius={4} />
      </View>

      {/* Featured carousel */}
      <View className="px-5">
        <Skeleton width={280} height={160} borderRadius={16} />
      </View>

      {/* Favorites header */}
      <View className="flex-row items-center justify-between px-5 mt-6 mb-3">
        <Skeleton width={100} height={18} borderRadius={4} />
        <Skeleton width={80} height={14} borderRadius={4} />
      </View>

      {/* Favorites circles */}
      <View className="flex-row gap-4 px-5">
        {[0, 1, 2, 3].map((i) => (
          <View key={i} className="items-center gap-2">
            <Skeleton width={72} height={72} borderRadius={36} />
            <Skeleton width={48} height={10} borderRadius={4} />
          </View>
        ))}
      </View>
    </View>
  );
}
