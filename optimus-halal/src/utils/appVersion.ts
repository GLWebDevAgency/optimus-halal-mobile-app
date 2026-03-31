/**
 * App Version — Single Source of Truth
 *
 * Reads the version string from app.config.ts via expo-constants at runtime.
 * Every screen, hook, or service that needs the app version MUST import from here.
 *
 * @module utils/appVersion
 */

import Constants from "expo-constants";

/** App version from app.config.ts — single source of truth */
export const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";
