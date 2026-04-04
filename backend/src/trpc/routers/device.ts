/**
 * Device Router — Public endpoints for device lifecycle.
 *
 * Trial state is managed server-side in the `devices` table.
 * The client reads trial status from here — MMKV is only an optimistic cache.
 * This eliminates trial bypass via reinstall (device ID is in SecureStore/Keychain).
 */

import { router, publicProcedure } from "../trpc.js";
import { TRPCError } from "@trpc/server";

export const deviceRouter = router({
  /**
   * Get trial status for the current device.
   *
   * Returns the server-authoritative trial state based on `devices.trialExpiresAt`.
   * The client uses this to sync its local MMKV cache on each app launch.
   *
   * No auth required — works for anonymous guests (X-Device-Id header).
   */
  getTrialStatus: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.device) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Device ID requis (header X-Device-Id)",
      });
    }

    const { trialStartedAt, trialExpiresAt, convertedAt } = ctx.device;
    const now = new Date();

    // Trial is active when:
    // 1. trialExpiresAt is set and in the future
    // 2. Device has NOT been converted (user hasn't created an account)
    //    Once converted → user is Naqiy+ (premium), trial is irrelevant
    const isActive =
      !!trialExpiresAt &&
      !convertedAt &&
      new Date(trialExpiresAt) > now;

    const daysRemaining = isActive && trialExpiresAt
      ? Math.max(0, Math.ceil((new Date(trialExpiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    const hasExpired = !!trialExpiresAt && !isActive && !convertedAt;

    return {
      isActive,
      hasExpired,
      daysRemaining,
      startsAt: trialStartedAt?.toISOString() ?? null,
      expiresAt: trialExpiresAt ? new Date(trialExpiresAt).toISOString() : null,
    };
  }),
});
