/**
 * Push Notifications Service — Expo Push API
 *
 * Sends push notifications via Expo's managed push service.
 * No native SDK required — pure HTTP, works for iOS + Android.
 * Max 100 messages per request (Expo limit), batched automatically.
 *
 * Docs: https://docs.expo.dev/push-notifications/sending-notifications/
 */

import { logger } from "../lib/logger.js";

export interface PushMessage {
  to: string; // ExponentPushToken[...]
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string; // Android notification channel
  priority?: "default" | "normal" | "high";
}

interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const BATCH_SIZE = 100;

export async function sendPushNotifications(
  messages: PushMessage[]
): Promise<{ sent: number; failed: number }> {
  if (messages.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        logger.warn("Expo push batch failed", { status: response.status, batchSize: batch.length });
        failed += batch.length;
        continue;
      }

      const result = (await response.json()) as { data: ExpoPushTicket[] };

      for (const ticket of result.data ?? []) {
        if (ticket.status === "ok") {
          sent++;
        } else {
          failed++;
          if (ticket.details?.error === "DeviceNotRegistered") {
            // Token is stale — caller should deactivate it
            logger.info("Push token no longer valid", { message: ticket.message });
          }
        }
      }
    } catch (err) {
      logger.warn("Expo push request threw", { error: String(err), batchSize: batch.length });
      failed += batch.length;
    }
  }

  return { sent, failed };
}
