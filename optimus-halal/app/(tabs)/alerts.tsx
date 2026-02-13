/**
 * Ethical Alerts Feed Screen
 * 
 * Flux d'alertes avec:
 * - Header avec icône et notifications
 * - Filtres (All, Boycotts, Certifications, Health, Policy)
 * - Timeline avec différents types d'alertes
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  useColorScheme,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
} from "react-native-reanimated";

import { Card, Badge, IconButton, Chip, ChipGroup } from "@/components/ui";
import { useLocalAlertsStore } from "@/store";
import { colors } from "@/constants/theme";

// Alert types
type AlertType = "boycott" | "certification" | "health" | "policy";

interface Alert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  image?: string;
  source: string;
  sourceIcon?: string;
  time: string;
  badge?: string;
  action?: {
    label: string;
    variant: "primary" | "secondary";
  };
}

const FILTERS = [
  { id: "all", label: "Tous" },
  { id: "boycott", label: "Boycotts" },
  { id: "certification", label: "Certifications" },
  { id: "health", label: "Santé" },
  { id: "policy", label: "Politique" },
];

const MOCK_ALERTS: Alert[] = [
  {
    id: "1",
    type: "boycott",
    title: "Boycott: Brand X Soda",
    description:
      "Investissement de la société mère identifié dans des régions interdites. Violations majeures des directives d'approvisionnement éthique signalées.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDMRROkfqx720sGkDhwQlWfuoWVtzSLb57m1wc53338BQi5KiJ9_-c3gHDK9X3XrYdQvzSYU2erwYtdnEOidE0lqKq3nAb1VnnPVGbTAlJmx-5q0beIptz3F0YAmyZtdJgu1PymnTMP7fOqG-koWQs04f52ItKnJthwfhoR94XwUyMsvWOo1creNW-FmWfaVSW2RFjDz04vHXDnw5ntjg86ItpcvHbUBjVOSOENjmC7f-m70mChgA7pkEEW4_0YSFur9Og-DkL1UBXA",
    source: "Global Ethical Watch",
    time: "Il y a 2h",
    badge: "Boycott Actif",
  },
  {
    id: "2",
    type: "certification",
    title: "Nouveau: Organic Poultry Co.",
    description:
      "Entièrement vérifié par l'Autorité Halal Mondiale. Traçabilité de la ferme à la table confirmée.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAXg59aHTtSgDTpWFbZCE_KAc_HZsmdVZDpiJrgbwwy4MyHd-VGP7AOA9D09G4X3q_o0iHUNawNZAwN1WNPOpFICWr6xSSVTwW24Ajm76n_Dz9_RnINCfxiFD6I5ZA2yTO88LmTptthAdTR4MdcIjy-H5dXmz0uosRpDWGJHDahxDk_3MdzBnAu171ecXlhn5JfIJ8oHmfdYztw9o3mUsGluX1d88k3UH9K80C2yUJLQWLL6Lz2OvEQnBKEb7CWUZCKm67ue_LZWIlW",
    source: "Audit Standard Or",
    sourceIcon: "workspace-premium",
    time: "Il y a 5h",
    badge: "Certifié Halal",
    action: { label: "Lire le rapport", variant: "secondary" },
  },
  {
    id: "3",
    type: "health",
    title: "Rappel: Lot #4928 Épices",
    description:
      "Contamination détectée dans \"Supreme Chili Powder\". Veuillez retourner le lot #4928 immédiatement au point d'achat.",
    source: "Conseil de Sécurité Sanitaire",
    time: "Il y a 1j",
    badge: "Rappel Santé",
    action: { label: "Vérifier mon lot", variant: "primary" },
  },
  {
    id: "4",
    type: "policy",
    title: "Nouvelle réglementation UE",
    description:
      "Nouvelles exigences d'étiquetage pour les produits halal en vigueur à partir du 1er janvier 2025.",
    source: "Commission Européenne",
    time: "Il y a 3j",
    badge: "Politique",
  },
];

const alertTypeConfig: Record<
  AlertType,
  { icon: keyof typeof MaterialIcons.glyphMap; color: string; bgColor: string }
> = {
  boycott: { icon: "block", color: "#ef4444", bgColor: "rgba(239,68,68,0.1)" },
  certification: { icon: "verified-user", color: "#1de560", bgColor: "rgba(29,229,96,0.2)" },
  health: { icon: "medical-services", color: "#eab308", bgColor: "rgba(234,179,8,0.2)" },
  policy: { icon: "gavel", color: "#6366f1", bgColor: "rgba(99,102,241,0.2)" },
};

interface AlertCardProps {
  alert: Alert;
  index: number;
}

function AlertCard({ alert, index }: AlertCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const config = alertTypeConfig[alert.type];

  return (
    <Animated.View
      entering={FadeInLeft.delay(200 + index * 100).duration(500)}
      className="flex-row"
    >
      {/* Timeline Icon */}
      <View className="items-center w-14 pt-1">
        <View
          className="w-14 h-14 rounded-full items-center justify-center border-4"
          style={{
            backgroundColor: config.bgColor,
            borderColor: isDark ? "#112116" : "#f6f8f6",
          }}
        >
          <MaterialIcons name={config.icon} size={24} color={config.color} />
        </View>
        {/* Timeline line */}
        <View
          className="flex-1 w-0.5 mt-2"
          style={{ backgroundColor: isDark ? "#334155" : "#e2e8f0" }}
        />
      </View>

      {/* Card Content */}
      <View className="flex-1 pl-3 pb-8">
        {/* Badge & Time */}
        <View className="flex-row items-center justify-between mb-2">
          <View
            className="px-2 py-0.5 rounded"
            style={{
              backgroundColor:
                alert.type === "boycott"
                  ? "rgba(239,68,68,0.1)"
                  : alert.type === "certification"
                  ? isDark
                    ? "rgba(16,185,129,0.3)"
                    : "rgba(16,185,129,0.1)"
                  : alert.type === "health"
                  ? isDark
                    ? "rgba(234,179,8,0.3)"
                    : "rgba(234,179,8,0.1)"
                  : isDark
                  ? "rgba(99,102,241,0.3)"
                  : "rgba(99,102,241,0.1)",
            }}
          >
            <Text
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: config.color }}
            >
              {alert.badge}
            </Text>
          </View>
          <Text className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            {alert.time}
          </Text>
        </View>

        {/* Card */}
        <Card variant="outlined" className="overflow-hidden">
          {/* Image for boycott alerts */}
          {alert.type === "boycott" && alert.image && (
            <View className="h-40 w-full relative overflow-hidden">
              <Image
                source={{ uri: alert.image }}
                className="w-full h-full"
                resizeMode="cover"
              />
              <View className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <Text className="absolute bottom-3 left-4 text-white text-lg font-bold">
                {alert.title}
              </Text>
            </View>
          )}

          <View className="p-4">
            {/* Title for non-boycott alerts */}
            {alert.type !== "boycott" && (
              <View className="flex-row gap-4 mb-3">
                <View className="flex-1">
                  <Text className="text-slate-900 dark:text-white font-bold text-lg leading-tight mb-2">
                    {alert.title}
                  </Text>
                  <Text className="text-slate-600 dark:text-gray-300 text-sm leading-relaxed">
                    {alert.description}
                  </Text>
                </View>
                {alert.type === "certification" && alert.image && (
                  <View className="w-24 h-24 rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <Image
                      source={{ uri: alert.image }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  </View>
                )}
              </View>
            )}

            {/* Description for boycott */}
            {alert.type === "boycott" && (
              <Text className="text-slate-600 dark:text-gray-300 text-sm leading-relaxed mb-3">
                {alert.description}
              </Text>
            )}

            {/* Source & Action for health/policy */}
            {(alert.type === "health" || alert.type === "policy") && (
              <View className="mb-3">
                {alert.sourceIcon && (
                  <View className="flex-row items-center gap-2 mb-2">
                    <MaterialIcons
                      name={alert.sourceIcon as any}
                      size={18}
                      color="#fbbf24"
                    />
                    <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {alert.source}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Footer */}
            {alert.type === "boycott" && (
              <View className="pt-3 border-t border-slate-100 dark:border-slate-700 flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 items-center justify-center">
                    <MaterialIcons name="public" size={12} color="#64748b" />
                  </View>
                  <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {alert.source}
                  </Text>
                </View>
                <TouchableOpacity className="flex-row items-center gap-1">
                  <Text className="text-xs font-bold text-danger-500">
                    Voir la source
                  </Text>
                  <MaterialIcons name="arrow-forward" size={14} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}

            {/* Action buttons */}
            {alert.action && (
              <View className="flex-row gap-2 mt-2">
                <TouchableOpacity
                  className={`flex-1 h-9 rounded-lg items-center justify-center ${
                    alert.action.variant === "primary"
                      ? "bg-primary"
                      : "bg-slate-50 dark:bg-slate-700/50"
                  }`}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`text-sm font-bold ${
                      alert.action.variant === "primary"
                        ? "text-slate-900"
                        : "text-slate-700 dark:text-gray-200"
                    }`}
                  >
                    {alert.action.label}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-600 items-center justify-center"
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name="share"
                    size={18}
                    color={isDark ? "#94a3b8" : "#64748b"}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Card>
      </View>
    </Animated.View>
  );
}

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [activeFilter, setActiveFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const { alerts, unreadCount, markAllAsRead } = useLocalAlertsStore();

  const filteredAlerts = useMemo(() => {
    if (activeFilter === "all") return MOCK_ALERTS;
    return MOCK_ALERTS.filter((alert) => alert.type === activeFilter);
  }, [activeFilter]);

  const handleFilterChange = useCallback(async (filterId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(filterId);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRefreshing(false);
  }, []);

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        className="bg-background-light/95 dark:bg-background-dark/95 border-b border-slate-100 dark:border-slate-800"
        style={{ paddingTop: insets.top }}
      >
        <View className="flex-row items-center justify-between px-4 py-3">
          <View className="flex-row items-center gap-3">
            <View
              className="w-8 h-8 rounded-full bg-primary items-center justify-center"
              style={{
                shadowColor: "#1de560",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
              }}
            >
              <MaterialIcons name="security" size={20} color="#0d1b13" />
            </View>
            <Text className="text-slate-900 dark:text-white text-xl font-bold tracking-tight">
              Alertes Éthiques
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/settings/notifications")}
            className="relative p-2 rounded-full"
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="settings"
              size={24}
              color={isDark ? "#d1d5db" : "#475569"}
            />
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8 }}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              onPress={() => handleFilterChange(filter.id)}
              className={`h-9 px-5 rounded-full items-center justify-center ${
                activeFilter === filter.id
                  ? "bg-slate-900 dark:bg-white"
                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              }`}
              activeOpacity={0.7}
            >
              <Text
                className={`text-sm ${
                  activeFilter === filter.id
                    ? "font-semibold text-white dark:text-slate-900"
                    : "font-medium text-slate-600 dark:text-gray-300"
                }`}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={isDark ? "#1de560" : "#059669"}
          />
        }
      >
        {/* Timeline line background */}
        <View className="relative">
          {filteredAlerts.map((alert, index) => (
            <AlertCard key={alert.id} alert={alert} index={index} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
