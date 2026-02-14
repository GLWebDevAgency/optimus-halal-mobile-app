/**
 * Marketplace Order Tracking Screen
 * 
 * Page suivi commande avec:
 * - Header "Mes Commandes" avec filtres
 * - Commande active avec carte map, livreur, timeline
 * - Liste produits de l'envoi
 * - Commandes passées
 * - Boutons Track & Support
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useHaptics } from "@/hooks";
import { ImpactFeedbackStyle } from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";

// Timeline Step Component
function TimelineStep({
  icon,
  title,
  subtitle,
  isCompleted,
  isCurrent,
  isLast,
  isDark,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle?: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isLast: boolean;
  isDark: boolean;
}) {
  const getCircleStyle = () => {
    if (isCompleted || isCurrent) {
      return "bg-primary";
    }
    return "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700";
  };

  const getIconColor = () => {
    if (isCompleted || isCurrent) {
      return "#102216";
    }
    return "#9ca3af";
  };

  return (
    <>
      <View className="flex-col items-center">
        <View
          className={`h-8 w-8 rounded-full flex items-center justify-center z-10 ${getCircleStyle()} ${
            isCurrent ? "ring-4 ring-primary/20" : ""
          }`}
        >
          <MaterialIcons
            name={isCompleted && !isCurrent ? "check" : icon}
            size={18}
            color={getIconColor()}
          />
        </View>
        {!isLast && (
          <View
            className={`w-0.5 min-h-[24px] h-full ${
              isCompleted ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"
            }`}
          />
        )}
      </View>
      <View className={`pb-6 pt-1 ${isLast ? "" : ""}`}>
        <Text
          className={`text-sm font-bold ${
            isCompleted || isCurrent
              ? "text-slate-900 dark:text-white"
              : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {title}
        </Text>
        {subtitle && (
          <Text className="text-xs text-slate-500 dark:text-gray-400">
            {subtitle}
          </Text>
        )}
      </View>
    </>
  );
}

// Past Order Item Component
function PastOrderItem({
  orderId,
  date,
  items,
  total,
  isDark,
}: {
  orderId: string;
  date: string;
  items: number;
  total: number;
  isDark: boolean;
}) {
  return (
    <View className="bg-white dark:bg-[#1a2e22] p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex-row items-center gap-4">
      <View className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
        <MaterialIcons name="inventory-2" size={24} color="#9ca3af" />
      </View>
      <View className="flex-1">
        <View className="flex-row justify-between items-baseline mb-1">
          <Text className="text-sm font-bold text-slate-900 dark:text-white" numberOfLines={1}>
            Commande {orderId}
          </Text>
          <Text className="text-xs font-medium text-slate-500 dark:text-gray-400">
            {date}
          </Text>
        </View>
        <View className="flex-row justify-between items-center">
          <Text className="text-xs text-slate-500 dark:text-gray-400">
            {items} articles • Livré
          </Text>
          <Text className="text-sm font-bold text-slate-900 dark:text-white">
            €{total.toFixed(2)}
          </Text>
        </View>
      </View>
      <TouchableOpacity className="px-2 py-1">
        <Text className="text-sm font-semibold text-primary">
          Recommander
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function OrderTrackingScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { impact } = useHaptics();
  const isDark = colorScheme === "dark";

  const [activeFilter, setActiveFilter] = useState<"active" | "past" | "returns">("active");

  const handleBackToHome = useCallback(async () => {
    impact();
    router.replace("/(tabs)");
  }, []);

  const handleCallDriver = useCallback(async () => {
    impact(ImpactFeedbackStyle.Medium);
    // In real app, trigger phone call
  }, []);

  const filters = [
    { id: "active", label: "Actives" },
    { id: "past", label: "Passées" },
    { id: "returns", label: "Retours" },
  ] as const;

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800"
        style={{ paddingTop: insets.top }}
      >
        <View className="flex-row items-center p-4 justify-between">
          <Text className="text-xl font-bold leading-tight tracking-tight flex-1 text-slate-900 dark:text-white">
            Mes Commandes
          </Text>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity className="w-10 h-10 items-center justify-center rounded-full">
              <MaterialIcons name="search" size={24} color={isDark ? "#ffffff" : "#0f172a"} />
            </TouchableOpacity>
            <TouchableOpacity className="w-10 h-10 items-center justify-center rounded-full">
              <MaterialIcons name="tune" size={24} color={isDark ? "#ffffff" : "#0f172a"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              onPress={() => setActiveFilter(filter.id)}
              className={`h-9 px-5 rounded-full items-center justify-center shadow-sm ${
                activeFilter === filter.id
                  ? "bg-primary"
                  : "bg-white dark:bg-[#1a2e22] border border-gray-200 dark:border-gray-700"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  activeFilter === filter.id
                    ? "text-[#102216]"
                    : "text-slate-600 dark:text-gray-300"
                }`}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Order Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} className="gap-4">
          <View className="flex-row items-center justify-between px-1">
            <Text className="text-lg font-bold text-slate-900 dark:text-white">
              Commande en cours
            </Text>
            <View className="bg-primary/10 px-2 py-1 rounded-full border border-primary/20">
              <Text className="text-xs font-medium text-primary">
                #CMD-2491
              </Text>
            </View>
          </View>

          <View className="bg-white dark:bg-[#1a2e22] rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            {/* Status Header */}
            <View className="p-5 border-b border-gray-100 dark:border-gray-800">
              <Text className="text-2xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white mb-1">
                Arrivée aujourd'hui
              </Text>
              <Text className="text-sm font-medium text-slate-500 dark:text-gray-400">
                Estimation: 17h00
              </Text>
            </View>

            {/* Map Visualization */}
            <View className="relative h-48 w-full bg-gray-100 dark:bg-gray-800">
              <Image
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDxFVSV06Sk1zmUKAsORbQQlTKKj8pvfQdd1vMaxzmOeQMjpB1ajwFTHQUk6VnpSL8_v-WeMlOnv1fWxaLs7Zvl5mqeP_w33ItXc1sOVEajzl1BkNftQemRvMgVpjilcdk889z4Rx4KfLbb2cNHnREdEMo8b5psVkvd7KyNPM9NhLJ7dpaH_G62l1sgMhNaRL0AiHEqjR7yJj92C0QjHFZ7aLWmnQdQ-uHTvrxZnUkME_2xMon2IQhcWykhV5XT3j95p6Jl-hHHFJfg",
                }}
                className="absolute inset-0 w-full h-full opacity-80"
                contentFit="cover"
                transition={200}
              />

              {/* Driver Overlay */}
              <View className="absolute bottom-3 left-3 right-3 bg-white/90 dark:bg-[#1a2e22]/90 backdrop-blur-sm p-3 rounded-lg flex-row items-center gap-3 shadow-lg border border-white/20">
                <Image
                  source={{
                    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuATxNsAxtnFYMdkvTViEnugcP5WpDXa-riqxA44tC8mGITx3y3yvHwMeFNcB2GopWXeW4luu1CtnkQAKdO93cQfH5wgwAjjlPwU7eqHEzSSMQ--565cUgOdMXmvB8eEJD5ASu83ze9clFIdXp3Gc61OzWLsrvH0kQNa25iTlk2EhXe2i1qKit3na4TUYN6ST_1Pv8WapAuYk_hKH4N2cuTh1XiDS4s1UrxLCrbRmafSd7h1mCTS5NtJYvHWLJ8dD2F6lV45tbMzVbhm",
                  }}
                  className="h-10 w-10 rounded-full bg-gray-200"
                  transition={200}
                />
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                    Ahmed Al-Sayed
                  </Text>
                  <Text className="text-xs text-slate-500 dark:text-gray-400">
                    Livreur • 4.9 ★
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleCallDriver}
                  className="h-8 w-8 rounded-full bg-primary items-center justify-center shadow-sm"
                >
                  <MaterialIcons name="call" size={18} color="#102216" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Timeline */}
            <View className="p-5">
              <View className="flex-row flex-wrap" style={{ flexDirection: "row", flexWrap: "wrap" }}>
                <View className="grid-cols-[32px_1fr]" style={{ width: "100%" }}>
                  {/* Using rows for timeline */}
                  <View className="flex-row">
                    <View className="items-center w-8">
                      <View className="h-8 w-8 rounded-full bg-primary items-center justify-center z-10">
                        <MaterialIcons name="check" size={18} color="#102216" />
                      </View>
                      <View className="w-0.5 bg-primary h-6" />
                    </View>
                    <View className="flex-1 pb-6 pt-1 pl-3">
                      <Text className="text-sm font-bold text-slate-900 dark:text-white">
                        Commande passée
                      </Text>
                      <Text className="text-xs text-slate-500 dark:text-gray-400">
                        12 Jan, 10:23
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row">
                    <View className="items-center w-8">
                      <View className="h-8 w-8 rounded-full bg-primary items-center justify-center z-10">
                        <MaterialIcons name="check" size={18} color="#102216" />
                      </View>
                      <View className="w-0.5 bg-primary h-6" />
                    </View>
                    <View className="flex-1 pb-6 pt-1 pl-3">
                      <Text className="text-sm font-bold text-slate-900 dark:text-white">
                        Emballé & Contrôlé
                      </Text>
                      <Text className="text-xs text-slate-500 dark:text-gray-400">
                        12 Jan, 14:45 • <Text className="text-primary font-medium">Halal Vérifié</Text>
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row">
                    <View className="items-center w-8">
                      <View className="h-8 w-8 rounded-full bg-primary items-center justify-center z-10 ring-4 ring-primary/20">
                        <MaterialIcons name="local-shipping" size={18} color="#102216" />
                      </View>
                      <View className="w-0.5 bg-gray-200 dark:bg-gray-700 h-6" />
                    </View>
                    <View className="flex-1 pb-6 pt-1 pl-3">
                      <Text className="text-sm font-bold text-slate-900 dark:text-white">
                        En cours de livraison
                      </Text>
                      <Text className="text-xs text-slate-500 dark:text-gray-400">
                        Aujourd'hui, 16:15
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row">
                    <View className="items-center w-8">
                      <View className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 items-center justify-center z-10">
                        <MaterialIcons name="home" size={18} color="#9ca3af" />
                      </View>
                    </View>
                    <View className="flex-1 pt-1 pl-3">
                      <Text className="text-sm font-medium text-gray-400 dark:text-gray-500">
                        Livré
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Shipment Items */}
            <View className="border-t border-gray-100 dark:border-gray-800 p-5 bg-gray-50 dark:bg-[#1a2e22]/50">
              <Text className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Articles de l'envoi
              </Text>
              <View className="gap-3">
                {/* Item 1 */}
                <View className="flex-row items-center gap-3">
                  <View className="h-12 w-12 rounded-lg bg-white dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700">
                    <Image
                      source={{
                        uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAKzg0JtfxDCdj8y2q3LU0n8jFHRrC4yBnvn5zxmXRx5qms5pVw7FOTKI6Njrz8pRjTtn2is9FTB-GYzZBAndqfQ6tUF_iRRNddU-5DUpsj5HCpL6BPsqLRvSMS5ZQlv-P0nRfUA27h5Nty-SUc_iOFSXb0UOM9SQULPLO6YTl8PaoPSUQ-g_h_UqCfuFbazZ-R9AeUQmlYjOg0EByNSkf_oMsM8tkh2OtwKnL3M7FkW4nQBi9-53Fg25Qtkpx251F-IPUUmiGXz5pq",
                      }}
                      className="w-full h-full rounded-md"
                      contentFit="cover"
                      transition={200}
                    />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row justify-between items-start">
                      <Text className="text-sm font-semibold text-slate-900 dark:text-white">
                        Dattes Ajwa Bio
                      </Text>
                      <Text className="text-sm font-medium text-slate-900 dark:text-white">
                        €24.00
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1 mt-0.5">
                      <MaterialIcons name="verified" size={12} color="#2bee6c" />
                      <Text className="text-xs text-slate-500 dark:text-gray-400">
                        Source Éthique • Médine
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Item 2 */}
                <View className="flex-row items-center gap-3">
                  <View className="h-12 w-12 rounded-lg bg-white dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700">
                    <Image
                      source={{
                        uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuADQ9tfoxho2--LyEsJ8RK2pUNlci6667Tv308TgDPtJ-K-MxZeKNLnhp7H7tY3gAeDCrAVHHYfDVVEqz846eoYkg1NutstVME6Sj4F2O_VFkghfMYRZdqLE7WUkkalAovW33Irmc8VW9a2W5mxYO1pF3wNP8Eu9mOvPYinKZwRlYnt2p9aEe0OMwpBXVuEYlFZrrvvm8aPLODU-ErYnTy_EbKHT_YR6I_AHSrD7pdlk7jB8azjpNnEL9Z5_q4xoXOhe__Yc5j3jU_c",
                      }}
                      className="w-full h-full rounded-md"
                      contentFit="cover"
                      transition={200}
                    />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row justify-between items-start">
                      <Text className="text-sm font-semibold text-slate-900 dark:text-white">
                        Agneau Élevé à l'Herbe
                      </Text>
                      <Text className="text-sm font-medium text-slate-900 dark:text-white">
                        €45.50
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1 mt-0.5">
                      <MaterialIcons name="verified" size={12} color="#2bee6c" />
                      <Text className="text-xs text-slate-500 dark:text-gray-400">
                        Certifié HMC • NZ
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View className="p-4 flex-row gap-3">
              <TouchableOpacity className="flex-1 bg-primary h-12 rounded-lg flex-row items-center justify-center gap-2">
                <MaterialIcons name="near-me" size={20} color="#102216" />
                <Text className="font-bold text-[#102216]">
                  Suivre Livreur
                </Text>
              </TouchableOpacity>
              <TouchableOpacity className="w-12 h-12 rounded-lg border border-gray-200 dark:border-gray-700 items-center justify-center">
                <MaterialIcons
                  name="support-agent"
                  size={20}
                  color={isDark ? "#d1d5db" : "#475569"}
                />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Past Orders */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} className="gap-4 pt-2">
          <Text className="text-lg font-bold px-1 text-slate-900 dark:text-white">
            Commandes passées
          </Text>

          <PastOrderItem
            orderId="#2301-B"
            date="02 Jan"
            items={4}
            total={120.0}
            isDark={isDark}
          />

          <PastOrderItem
            orderId="#2188-A"
            date="15 Déc"
            items={2}
            total={55.2}
            isDark={isDark}
          />
        </Animated.View>

        {/* Back to Home Button */}
        <TouchableOpacity
          onPress={handleBackToHome}
          className="mt-4 py-3 items-center"
        >
          <Text className="text-sm font-medium text-primary">
            Retour à l'accueil
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
