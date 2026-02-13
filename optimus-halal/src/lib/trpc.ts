import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@backend/trpc/router";
import { API_CONFIG } from "@services/api/config";
import { getAccessToken, getDeviceId } from "@services/api/client";

export const trpc = createTRPCReact<AppRouter>();

export function createTRPCClientForProvider() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${API_CONFIG.baseUrl}${API_CONFIG.trpcPath}`,
        transformer: superjson,
        headers: async () => {
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "X-App-Version": "1.0.0",
            "X-Platform": "mobile",
          };

          const token = getAccessToken();
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }

          const deviceId = await getDeviceId();
          headers["X-Device-Id"] = deviceId;

          return headers;
        },
      }),
    ],
  });
}
