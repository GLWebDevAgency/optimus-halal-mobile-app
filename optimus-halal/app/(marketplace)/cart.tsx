/**
 * Marketplace Shopping Cart Screen
 * 
 * Page panier avec:
 * - Header avec count articles
 * - Liste produits avec images, badges, quantités
 * - Order summary (subtotal, tax, shipping)
 * - Bouton checkout fixé en bas
 */

import React, { useCallback } from "react";
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
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";

import { useLocalCartStore } from "@/store";

// Extended cart items with full product info (in real app, fetch from products DB)
const CART_PRODUCTS = {
  "1": {
    id: "1",
    name: "Poulet Halal Bio",
    brand: "Green Valley Farms",
    price: 12.50,
    priceUnit: "par kg",
    badges: [
      { label: "Halal", icon: "verified", color: "green" },
      { label: "Bio", icon: "eco", color: "blue" },
    ],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDv_qYlm1qebmdmMo-fx-URwIae5kwSZn0OjPbSFz6Ga5dDcR8uaotx8-ZYqdQeNPVPh-fU3F6smmY6uVenIK989hFs1Cxl7Neo-Y5-e5RkE5mMdEcL576bE2FqKQ1JdSDc8NugUmJoNXdgRWdd0ZIrXxrZoExKHQTZMxzK75VpFjaNJT4BRQ0QxBitfTDHQrXAVZbkl3wa3jxcS0cMn15pXQ7GUrDeJt-Z1OemTHCztX6fhWBf0VGedPWdw7QkL5eoNKj5JI0rOK7X",
  },
  "2": {
    id: "2",
    name: "Miel Éthique Bio",
    brand: "Pure Hive Co.",
    price: 18.00,
    priceUnit: "par pot",
    badges: [
      { label: "Raw", icon: "hive", color: "orange" },
    ],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDDxUW3kDM3a3JXDLldn5xFcWZ55VKUqmPVld2BiJ_KtEvi0kh4Ded9goSyP53QGHV9jhfksIVhf_Yxahm4yrWsLJFrKA8QRXPw8vZRviC5nSUp95qtKDobJge7DjQ9nom1sy106mD34MmOxI_SuyJNTjZf1wSoJSHzSwFrXmgd8XMVxUOQ_ouFkuwRa6ZAQD55bAfgn38vbcmZY_rORWZmWF4aWmQ6SutN8Rlvwu1lEaYFLPVSnhwrjYe34BBSQG8W84Vt5lB8xVCn",
  },
  "3": {
    id: "3",
    name: "Dattes Commerce Équitable",
    brand: "Desert Gold",
    price: 8.99,
    priceUnit: "par boîte",
    badges: [
      { label: "Fair Trade", icon: "handshake", color: "purple" },
    ],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDICH2vXI49C6bUBh0jxYqL2PpcsMDwUfjRrCxStExeX_QQ5R9jfUJSv71psffRQYwtsXE0oUMBd14kXUCdmLaP03PQkbU5HsqvA_3zomlvigzUArJcUexdbJM5jNNFaOiSK48G47ogKRL0106wMEvuZoFDYcipK34rNIBLB0jMTiskdy46YyZ3sO9XMu7R9UFQNj1S-S3CsRDnVlj0IMGlIxJhblkpipgSD1FZ4G-ghv8acCZ2p6Rn_TksUfrMLPYJfcO5tee4TV1w",
  },
};

// Cart Item Component
function CartItem({
  item,
  onRemove,
  onUpdateQuantity,
  isDark,
  index,
}: {
  item: {
    productId: string;
    quantity: number;
    name: string;
    price: number;
    image: string;
  };
  onRemove: () => void;
  onUpdateQuantity: (delta: number) => void;
  isDark: boolean;
  index: number;
}) {
  const product = CART_PRODUCTS[item.productId as keyof typeof CART_PRODUCTS] || {
    id: item.productId,
    name: item.name,
    brand: "Vendeur",
    price: item.price,
    priceUnit: "par unité",
    badges: [],
    image: item.image,
  };

  const getBadgeColors = (color: string) => {
    switch (color) {
      case "green":
        return {
          bg: "bg-primary/20",
          text: "text-green-800 dark:text-primary",
        };
      case "blue":
        return {
          bg: "bg-blue-50 dark:bg-blue-900/30",
          text: "text-blue-700 dark:text-blue-300",
        };
      case "orange":
        return {
          bg: "bg-orange-50 dark:bg-orange-900/30",
          text: "text-orange-700 dark:text-orange-300",
        };
      case "purple":
        return {
          bg: "bg-purple-50 dark:bg-purple-900/30",
          text: "text-purple-700 dark:text-purple-300",
        };
      default:
        return {
          bg: "bg-slate-100 dark:bg-slate-700",
          text: "text-slate-700 dark:text-slate-300",
        };
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(400)}
      className="flex-row gap-3 bg-white dark:bg-[#1A2C22] p-3 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm"
    >
      {/* Product Image */}
      <View className="w-24 h-24 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700">
        <Image
          source={{ uri: product.image }}
          className="w-full h-full"
          contentFit="cover"
          transition={200}
        />
      </View>

      {/* Product Info */}
      <View className="flex-1 justify-between">
        <View>
          <View className="flex-row justify-between items-start gap-2">
            <View className="flex-1">
              <Text className="font-bold text-slate-900 dark:text-white leading-tight" numberOfLines={1}>
                {product.name}
              </Text>
              <View className="flex-row items-center gap-1 mt-1">
                <MaterialIcons name="storefront" size={12} color={isDark ? "#94a3b8" : "#64748b"} />
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                  {product.brand}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onRemove}
              className="p-1"
            >
              <MaterialIcons name="delete" size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Badges */}
          <View className="flex-row flex-wrap gap-1.5 mt-2">
            {product.badges.map((badge, i) => {
              const colors = getBadgeColors(badge.color);
              return (
                <View
                  key={i}
                  className={`flex-row items-center gap-0.5 px-1.5 py-0.5 rounded ${colors.bg}`}
                >
                  <MaterialIcons
                    name={badge.icon as any}
                    size={10}
                    color={isDark ? (badge.color === "green" ? "#2bee6c" : undefined) : undefined}
                  />
                  <Text className={`text-[10px] font-bold uppercase tracking-wider ${colors.text}`}>
                    {badge.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Price and Quantity */}
        <View className="flex-row justify-between items-end mt-3">
          <View>
            <Text className="text-base font-bold text-slate-900 dark:text-white">
              €{(product.price * item.quantity).toFixed(2)}
            </Text>
            <Text className="text-[10px] text-slate-400 font-medium">
              €{product.price.toFixed(2)} {product.priceUnit}
            </Text>
          </View>

          <View className="flex-row items-center gap-2 bg-slate-50 dark:bg-white/5 rounded-lg p-1 border border-slate-100 dark:border-white/5">
            <TouchableOpacity
              onPress={() => onUpdateQuantity(-1)}
              className="w-7 h-7 items-center justify-center rounded-md bg-white dark:bg-white/10 shadow-sm"
            >
              <MaterialIcons name="remove" size={14} color={isDark ? "#ffffff" : "#475569"} />
            </TouchableOpacity>
            <Text className="w-4 text-center text-sm font-semibold text-slate-900 dark:text-white">
              {item.quantity}
            </Text>
            <TouchableOpacity
              onPress={() => onUpdateQuantity(1)}
              className="w-7 h-7 items-center justify-center rounded-md bg-primary shadow-sm"
            >
              <MaterialIcons name="add" size={14} color="#0d1b12" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { items, itemCount, total, removeItem, updateQuantity } = useLocalCartStore();

  const handleBack = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  const handleRemoveItem = useCallback(async (productId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removeItem(productId);
  }, [removeItem]);

  const handleUpdateQuantity = useCallback(async (productId: string, delta: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const item = items.find((i) => i.productId === productId);
    if (item) {
      const newQuantity = item.quantity + delta;
      if (newQuantity <= 0) {
        removeItem(productId);
      } else {
        updateQuantity(productId, newQuantity);
      }
    }
  }, [items, removeItem, updateQuantity]);

  const handleCheckout = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.navigate("/(marketplace)/checkout" as any);
  }, []);

  const subtotal = total;
  const tax = subtotal * 0.06; // ~6% tax
  const shipping = subtotal > 50 ? 0 : 5.99;
  const orderTotal = subtotal + tax + shipping;

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        className="sticky top-0 z-50 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-slate-200/50 dark:border-white/5 px-4 py-3"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={handleBack}
            className="h-10 w-10 items-center justify-center rounded-full"
          >
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={isDark ? "#ffffff" : "#0d1b12"}
            />
          </TouchableOpacity>

          <Text className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Panier ({itemCount} {itemCount === 1 ? "article" : "articles"})
          </Text>

          <View className="w-10" />
        </View>
      </Animated.View>

      {items.length === 0 ? (
        /* Empty State */
        <Animated.View
          entering={FadeIn.delay(200).duration(500)}
          className="flex-1 items-center justify-center px-8"
        >
          <View className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center mb-6">
            <MaterialIcons name="shopping-cart" size={48} color={isDark ? "#64748b" : "#94a3b8"} />
          </View>
          <Text className="text-xl font-bold text-slate-800 dark:text-white text-center mb-2">
            Votre panier est vide
          </Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">
            Découvrez nos produits éthiques et certifiés halal
          </Text>
          <TouchableOpacity
            onPress={() => router.navigate("/(marketplace)/catalog" as any)}
            className="bg-primary px-6 py-3 rounded-xl flex-row items-center gap-2"
          >
            <MaterialIcons name="storefront" size={20} color="#0d1b12" />
            <Text className="font-bold text-slate-900">Explorer le catalogue</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16, paddingBottom: 200, gap: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Cart Items */}
            {items.map((item, index) => (
              <CartItem
                key={item.productId}
                item={item}
                onRemove={() => handleRemoveItem(item.productId)}
                onUpdateQuantity={(delta) => handleUpdateQuantity(item.productId, delta)}
                isDark={isDark}
                index={index}
              />
            ))}

            {/* Order Summary */}
            <Animated.View
              entering={FadeInDown.delay(items.length * 100 + 100).duration(400)}
              className="mt-4 p-5 bg-white dark:bg-[#1A2C22] rounded-xl border border-slate-100 dark:border-white/5 shadow-sm"
            >
              <Text className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">
                Récapitulatif
              </Text>

              <View className="gap-3">
                <View className="flex-row justify-between">
                  <Text className="text-sm text-slate-500 dark:text-slate-400">Sous-total</Text>
                  <Text className="text-sm font-medium text-slate-900 dark:text-white">
                    €{subtotal.toFixed(2)}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <Text className="text-sm text-slate-500 dark:text-slate-400">TVA estimée</Text>
                  <Text className="text-sm font-medium text-slate-900 dark:text-white">
                    €{tax.toFixed(2)}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <Text className="text-sm text-slate-500 dark:text-slate-400">Livraison</Text>
                  <Text className={`text-sm font-medium ${shipping === 0 ? "text-primary" : "text-slate-900 dark:text-white"}`}>
                    {shipping === 0 ? "Gratuit" : `€${shipping.toFixed(2)}`}
                  </Text>
                </View>

                <View className="h-px bg-slate-100 dark:bg-white/10 my-2" />

                <View className="flex-row items-center justify-center gap-2 py-1">
                  <MaterialIcons name="lock" size={14} color="#9ca3af" />
                  <Text className="text-xs text-slate-400 font-medium">
                    Paiement sécurisé garanti
                  </Text>
                </View>
              </View>
            </Animated.View>
          </ScrollView>

          {/* Fixed Bottom CTA */}
          <Animated.View
            entering={FadeInUp.delay(400).duration(400)}
            className="absolute bottom-0 left-0 right-0 bg-white/80 dark:bg-[#102216]/90 backdrop-blur-xl border-t border-slate-200 dark:border-white/5 shadow-lg"
            style={{ paddingBottom: insets.bottom + 16, paddingTop: 16, paddingHorizontal: 16 }}
          >
            <View className="flex-row justify-between items-center mb-4 px-1">
              <View>
                <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Montant Total
                </Text>
                <Text className="text-2xl font-bold text-slate-900 dark:text-white leading-none mt-1">
                  €{orderTotal.toFixed(2)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleCheckout}
              className="w-full bg-primary py-4 rounded-xl flex-row items-center justify-center gap-2 shadow-lg"
              activeOpacity={0.9}
              style={{
                shadowColor: "#2bee6c",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
              }}
            >
              <Text className="text-base font-bold text-[#0d1b12]">
                Passer la commande
              </Text>
              <MaterialIcons name="arrow-forward" size={20} color="#0d1b12" />
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
    </View>
  );
}
