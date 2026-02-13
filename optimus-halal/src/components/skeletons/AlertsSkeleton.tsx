/**
 * Alerts Screen Skeleton
 * Mirrors the timeline layout: filter chips + alert cards
 */

import React from "react";
import { View } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";

export function AlertsSkeleton() {
  return (
    <View className="px-4 pt-4">
      {[0, 1, 2].map((i) => (
        <View key={i} className="flex-row mb-6">
          {/* Timeline icon */}
          <View className="items-center w-14 pt-1">
            <Skeleton width={56} height={56} borderRadius={28} />
            <View className="flex-1 w-0.5 mt-2 bg-slate-200 dark:bg-slate-700" />
          </View>

          {/* Card */}
          <View className="flex-1 pl-3 pb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Skeleton width={100} height={20} borderRadius={4} />
              <Skeleton width={60} height={14} borderRadius={4} />
            </View>
            <Skeleton width="100%" height={180} borderRadius={12} />
          </View>
        </View>
      ))}
    </View>
  );
}
