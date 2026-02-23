/**
 * Marketplace Checkout Screen
 * 
 * Page checkout avec:
 * - Progress indicator (4 étapes)
 * - Section 1: Adresse de livraison
 * - Section 2: Méthode d'expédition
 * - Section 3: Paiement (Card/Apple Pay tabs)
 * - Section 4: Récapitulatif commande
 * - Badge éthique
 * - Prix breakdown
 * - Bouton passer commande fixé en bas
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
} from "react-native";
import { PremiumBackground } from "@/components/ui";
import { PressableScale } from "@/components/ui/PressableScale";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useHaptics, useTheme } from "@/hooks";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { useLocalCartStore } from "@/store";

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { impact, notification } = useHaptics();

  const { items, total, clearCart } = useLocalCartStore();

  const [selectedShipping, setSelectedShipping] = useState<"standard" | "express">("standard");
  const [paymentTab, setPaymentTab] = useState<"card" | "apple">("card");
  const [cardNumber, setCardNumber] = useState("•••• •••• •••• 4242");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const handleBack = useCallback(async () => {
    impact();
    router.back();
  }, []);

  const handlePlaceOrder = useCallback(async () => {
    notification();
    clearCart();
    router.replace("/(marketplace)/order-tracking" as any);
  }, [clearCart]);

  const shippingCost = selectedShipping === "express" ? 15.0 : 0;
  const subtotal = total;
  const tax = subtotal * 0.08; // ~8% tax
  const orderTotal = subtotal + shippingCost + tax;

  return (
    <View className="flex-1">
      <PremiumBackground />
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        className="sticky top-0 z-50 flex-row items-center backdrop-blur-md px-4 py-2 justify-between border-b border-gray-100 dark:border-gray-800"
        style={{ paddingTop: insets.top + 4, backgroundColor: isDark ? "rgba(12,12,12,0.92)" : "rgba(243,241,237,0.92)" }}
      >
        <Pressable
          onPress={handleBack}
          hitSlop={8}
        >
          <View className="p-2 -ml-2 rounded-full">
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={isDark ? "#ffffff" : "#0d1b12"}
            />
          </View>
        </Pressable>

        <Text className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          Paiement
        </Text>

        <View className="w-10" />
      </Animated.View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 200 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Indicators */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          className="flex-row items-center justify-center gap-3 py-5 px-4"
        >
          {[1, 2, 3, 4].map((step) => (
            <View
              key={step}
              className={`h-2 flex-1 max-w-[60px] rounded-full ${
                step <= 3 ? "bg-primary" : "bg-gray-300 dark:bg-gray-700"
              }`}
            />
          ))}
        </Animated.View>

        {/* Section 1: Delivery Address */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <View className="px-4 pb-2 pt-2">
            <Text className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              1. Adresse de livraison
            </Text>
          </View>

          <View className="px-4">
            <View className="flex-row items-center gap-4 bg-white dark:bg-[#1c3024] p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <View className="flex-row items-start gap-4 flex-1">
                <View className="w-12 h-12 items-center justify-center rounded-lg bg-[#e7f3eb] dark:bg-white/10">
                  <MaterialIcons name="location-on" size={24} color={isDark ? colors.primary : "#0d1b12"} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-slate-900 dark:text-white">
                    Domicile
                  </Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    12 Rue des Lilas,{"\n"}75001 Paris, France
                  </Text>
                </View>
              </View>
              <PressableScale>
                <View className="px-3 py-1.5">
                  <Text className="text-sm font-medium text-primary">
                    Modifier
                  </Text>
                </View>
              </PressableScale>
            </View>
          </View>
        </Animated.View>

        <View className="h-6" />

        {/* Section 2: Shipping Method */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text className="text-lg font-bold tracking-tight text-slate-900 dark:text-white px-4 pb-2">
            2. Mode de livraison
          </Text>

          <View className="px-4 gap-3">
            {/* Standard Delivery */}
            <PressableScale onPress={() => setSelectedShipping("standard")}>
              <View
                className={`flex-row items-center gap-4 bg-white dark:bg-[#1c3024] p-4 rounded-xl border-2 ${
                  selectedShipping === "standard"
                    ? "border-primary"
                    : "border-gray-100 dark:border-gray-800"
                } shadow-sm`}
              >
                <MaterialIcons
                  name={selectedShipping === "standard" ? "radio-button-checked" : "radio-button-unchecked"}
                  size={24}
                  color={selectedShipping === "standard" ? colors.primary : "#9ca3af"}
                />
                <View className="flex-1">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-base font-medium text-slate-900 dark:text-white">
                      Livraison Standard
                    </Text>
                    <Text className="font-bold text-slate-900 dark:text-white">
                      Gratuit
                    </Text>
                  </View>
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    3-5 jours ouvrés
                  </Text>
                </View>
              </View>
            </PressableScale>

            {/* Express Delivery */}
            <PressableScale onPress={() => setSelectedShipping("express")}>
              <View
                className={`flex-row items-center gap-4 bg-white dark:bg-[#1c3024] p-4 rounded-xl border-2 ${
                  selectedShipping === "express"
                    ? "border-primary"
                    : "border-gray-100 dark:border-gray-800"
                } shadow-sm`}
              >
                <MaterialIcons
                  name={selectedShipping === "express" ? "radio-button-checked" : "radio-button-unchecked"}
                  size={24}
                  color={selectedShipping === "express" ? colors.primary : "#9ca3af"}
                />
                <View className="flex-1">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-base font-medium text-slate-900 dark:text-white">
                      Express Éco
                    </Text>
                    <Text className="font-bold text-slate-900 dark:text-white">
                      €15.00
                    </Text>
                  </View>
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    1-2 jours ouvrés • Neutre en carbone
                  </Text>
                </View>
              </View>
            </PressableScale>
          </View>
        </Animated.View>

        <View className="h-6" />

        {/* Section 3: Payment */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)}>
          <Text className="text-lg font-bold tracking-tight text-slate-900 dark:text-white px-4 pb-2">
            3. Paiement
          </Text>

          <View className="px-4">
            <View className="bg-white dark:bg-[#1c3024] p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
              {/* Tab Switcher */}
              <View className="flex-row p-1 bg-gray-100 dark:bg-white/5 rounded-lg mb-4">
                <PressableScale
                  onPress={() => setPaymentTab("card")}
                  style={{ flex: 1 }}
                >
                  <View
                    className={`py-1.5 rounded-md items-center ${
                      paymentTab === "card"
                        ? "bg-white dark:bg-gray-700 shadow-sm"
                        : ""
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        paymentTab === "card"
                          ? "text-slate-900 dark:text-white"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      Carte
                    </Text>
                  </View>
                </PressableScale>
                <PressableScale
                  onPress={() => setPaymentTab("apple")}
                  style={{ flex: 1 }}
                >
                  <View
                    className={`py-1.5 rounded-md items-center ${
                      paymentTab === "apple"
                        ? "bg-white dark:bg-gray-700 shadow-sm"
                        : ""
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        paymentTab === "apple"
                          ? "text-slate-900 dark:text-white"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      Apple Pay
                    </Text>
                  </View>
                </PressableScale>
              </View>

              {/* Card Details */}
              {paymentTab === "card" && (
                <View className="gap-4">
                  <View className="relative">
                    <View className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                      <MaterialIcons name="credit-card" size={20} color="#9ca3af" />
                    </View>
                    <TextInput
                      className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg py-2.5 pl-10 pr-10 text-sm text-slate-900 dark:text-white"
                      placeholder="Numéro de carte"
                      placeholderTextColor="#9ca3af"
                      value={cardNumber}
                      onChangeText={setCardNumber}
                    />
                    <View className="absolute right-3 top-1/2 -translate-y-1/2">
                      <MaterialIcons name="lock" size={18} color={colors.primary} />
                    </View>
                  </View>

                  <View className="flex-row gap-4">
                    <TextInput
                      className="flex-1 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg py-2.5 px-4 text-sm text-slate-900 dark:text-white"
                      placeholder="MM/AA"
                      placeholderTextColor="#9ca3af"
                      value={cardExpiry}
                      onChangeText={setCardExpiry}
                    />
                    <View className="flex-1 relative">
                      <TextInput
                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg py-2.5 px-4 pr-10 text-sm text-slate-900 dark:text-white"
                        placeholder="CVC"
                        placeholderTextColor="#9ca3af"
                        value={cardCvc}
                        onChangeText={setCardCvc}
                        secureTextEntry
                      />
                      <View className="absolute right-3 top-1/2 -translate-y-1/2">
                        <MaterialIcons name="help" size={18} color="#9ca3af" />
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {paymentTab === "apple" && (
                <PressableScale>
                  <View className="bg-black py-3.5 rounded-lg flex-row items-center justify-center gap-2">
                    <MaterialIcons name="apple" size={24} color="#ffffff" />
                    <Text className="text-white font-semibold">
                      Payer avec Apple Pay
                    </Text>
                  </View>
                </PressableScale>
              )}
            </View>
          </View>
        </Animated.View>

        <View className="h-6" />

        {/* Section 4: Order Summary */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text className="text-lg font-bold tracking-tight text-slate-900 dark:text-white px-4 pb-2">
            4. Récapitulatif
          </Text>

          <View className="px-4 gap-3">
            {items.slice(0, 3).map((item, index) => (
              <View
                key={item.productId}
                className="flex-row items-center gap-4 bg-white dark:bg-[#1c3024] p-3 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm"
              >
                <View className="relative h-20 w-20 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    source={{ uri: item.image }}
                    className="w-full h-full"
                    contentFit="cover"
                    transition={200}
                  />
                  <View className="absolute top-1 left-1 bg-white/90 dark:bg-black/80 rounded-full p-0.5">
                    <MaterialIcons name="verified" size={12} color="#16a34a" />
                  </View>
                </View>
                <View className="flex-1 h-20 justify-between py-0.5">
                  <View>
                    <Text
                      className="text-sm font-medium text-slate-900 dark:text-white leading-tight"
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Qté: {item.quantity}
                    </Text>
                  </View>
                  <Text className="font-semibold text-slate-900 dark:text-white">
                    €{(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
            {items.length > 3 && (
              <Text className="text-xs text-gray-500 dark:text-gray-400 text-center">
                + {items.length - 3} autres articles
              </Text>
            )}
          </View>
        </Animated.View>

        {/* Ethical Impact Badge */}
        <Animated.View
          entering={FadeInDown.delay(350).duration(400)}
          className="px-4 mt-6"
        >
          <LinearGradient
            colors={isDark ? ["#1c3024", "#16291e"] : ["#e7f3eb", "#d4eedd"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="rounded-xl p-4 flex-row items-center gap-3 border border-primary/20"
          >
            <View className="bg-white dark:bg-white/10 p-2 rounded-full">
              <MaterialIcons name="volunteer-activism" size={24} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-slate-900 dark:text-white">
                Éthique & Halal Vérifié
              </Text>
              <Text className="text-xs text-[#4c9a66] dark:text-gray-400 mt-0.5">
                Votre commande soutient des pratiques d&apos;approvisionnement transparentes et éthiques.
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Price Breakdown */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(400)}
          className="px-4 mt-6 gap-3 mb-6"
        >
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-500 dark:text-gray-400">Sous-total</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400">
              €{subtotal.toFixed(2)}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-500 dark:text-gray-400">Livraison</Text>
            <Text className={`text-sm ${shippingCost === 0 ? "text-primary" : "text-gray-500 dark:text-gray-400"}`}>
              {shippingCost === 0 ? "Gratuit" : `€${shippingCost.toFixed(2)}`}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-500 dark:text-gray-400">TVA estimée</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400">
              €{tax.toFixed(2)}
            </Text>
          </View>
          <View className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
          <View className="flex-row justify-between">
            <Text className="text-base font-bold text-slate-900 dark:text-white">Total</Text>
            <Text className="text-base font-bold text-slate-900 dark:text-white">
              €{orderTotal.toFixed(2)}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Fixed Bottom CTA */}
      <Animated.View
        entering={FadeInUp.delay(500).duration(400)}
        className="absolute bottom-0 left-0 right-0 border-t border-gray-100 dark:border-gray-800 p-4 shadow-lg z-40"
        style={{ paddingBottom: insets.bottom + 16, backgroundColor: isDark ? "rgba(12,12,12,0.92)" : "rgba(243,241,237,0.92)" }}
      >
        <View className="flex-row items-center gap-4 mb-4">
          <View className="flex-1">
            <Text className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Total à payer
            </Text>
            <Text className="text-xl font-bold text-slate-900 dark:text-white">
              €{orderTotal.toFixed(2)}
            </Text>
          </View>
        </View>

        <PressableScale
          onPress={handlePlaceOrder}
          style={{
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
          }}
        >
          <View className="w-full bg-primary py-3.5 rounded-xl flex-row items-center justify-center gap-2 shadow-lg">
            <Text className="font-bold text-base text-[#0d1b12]">
              Passer la commande
            </Text>
            <MaterialIcons name="arrow-forward" size={18} color="#0d1b12" />
          </View>
        </PressableScale>
      </Animated.View>
    </View>
  );
}
