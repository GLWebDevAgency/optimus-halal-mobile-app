/**
 * RevenueCat Purchases Service
 *
 * Gère les abonnements Naqiy+ via RevenueCat.
 * Mode anonyme par défaut, identifié après création de compte.
 */

import { Platform } from "react-native";
import Purchases, {
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
  LOG_LEVEL,
} from "react-native-purchases";

const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS ?? "";
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID ?? "";
const ENTITLEMENT_ID = "naqiy_plus";

let isConfigured = false;

/**
 * Initialize RevenueCat SDK.
 * Called once at app startup from AppInitializer.
 */
export async function initPurchases(): Promise<void> {
  if (isConfigured) return;

  const apiKey = Platform.OS === "ios" ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
  if (!apiKey) {
    if (__DEV__) console.log("[Purchases] No API key — skipping RevenueCat init");
    return;
  }

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  Purchases.configure({ apiKey });
  isConfigured = true;
}

/**
 * Identify user after account creation/login.
 * Links anonymous RevenueCat user to our backend userId.
 */
export async function identifyUser(userId: string): Promise<CustomerInfo> {
  if (!isConfigured) throw new Error("RevenueCat not configured");
  const { customerInfo } = await Purchases.logIn(userId);
  return customerInfo;
}

/**
 * Log out user — RevenueCat generates new anonymous ID.
 */
export async function logoutPurchases(): Promise<void> {
  if (!isConfigured) return;
  await Purchases.logOut();
}

/**
 * Get available subscription offerings.
 */
export async function getOfferings(): Promise<PurchasesOfferings | null> {
  if (!isConfigured) return null;
  const offerings = await Purchases.getOfferings();
  return offerings;
}

/**
 * Purchase a package (monthly or annual).
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  if (!isConfigured) throw new Error("RevenueCat not configured");
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

/**
 * Restore previous purchases (e.g. after reinstall).
 */
export async function restorePurchases(): Promise<CustomerInfo> {
  if (!isConfigured) throw new Error("RevenueCat not configured");
  const customerInfo = await Purchases.restorePurchases();
  return customerInfo;
}

/**
 * Get current customer info (subscription status).
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isConfigured) return null;
  const customerInfo = await Purchases.getCustomerInfo();
  return customerInfo;
}

/**
 * Check if user has active Naqiy+ entitlement.
 */
export function isPremiumCustomer(info: CustomerInfo): boolean {
  return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

/**
 * Add listener for subscription changes (renewals, cancellations, etc.).
 * Returns a cleanup function to remove the listener on unmount.
 */
export function onCustomerInfoUpdated(
  listener: (info: CustomerInfo) => void,
): () => void {
  if (!isConfigured) return () => {};
  const remove = Purchases.addCustomerInfoUpdateListener(listener);
  return typeof remove === "function" ? remove : () => {};
}
