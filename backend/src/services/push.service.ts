import { env } from "../lib/env.js";

interface ExpoPushMessage {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;
}

interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error: string };
}

export async function sendPushNotification(
  message: ExpoPushMessage
): Promise<ExpoPushTicket[]> {
  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(env.EXPO_ACCESS_TOKEN
          ? { Authorization: `Bearer ${env.EXPO_ACCESS_TOKEN}` }
          : {}),
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error("[push] Expo push error:", response.status);
      return [];
    }

    const result = (await response.json()) as { data?: ExpoPushTicket[] };
    return result.data ?? [];
  } catch (err) {
    console.error("[push] Network error:", err instanceof Error ? err.message : err);
    return [];
  }
}

export async function sendBulkPushNotifications(
  messages: ExpoPushMessage[]
): Promise<ExpoPushTicket[]> {
  // Expo accepts up to 100 messages per request
  const chunks: ExpoPushMessage[][] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  const allTickets: ExpoPushTicket[] = [];
  for (let i = 0; i < chunks.length; i++) {
    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(env.EXPO_ACCESS_TOKEN
            ? { Authorization: `Bearer ${env.EXPO_ACCESS_TOKEN}` }
            : {}),
        },
        body: JSON.stringify(chunks[i]),
      });

      if (response.ok) {
        const result = (await response.json()) as { data?: ExpoPushTicket[] };
        allTickets.push(...(result.data ?? []));
      } else {
        console.error(`[push] Bulk chunk ${i + 1}/${chunks.length} failed:`, response.status);
      }
    } catch (err) {
      console.error(`[push] Bulk chunk ${i + 1}/${chunks.length} network error:`, err instanceof Error ? err.message : err);
    }
  }

  return allTickets;
}
