import { trpc } from "@/lib/trpc";
import { trackEvent } from "../lib/analytics";

export function useScanBarcode() {
  return trpc.scan.scanBarcode.useMutation({
    onSuccess: (_data, variables) => {
      trackEvent("scan_barcode", { barcode: variables.barcode });
    },
  });
}

export function useScanHistory(options?: { limit?: number }) {
  return trpc.scan.getHistory.useQuery(
    { limit: options?.limit ?? 20 },
    { staleTime: 1000 * 60 * 2 }
  );
}

export function useScanStats() {
  return trpc.scan.getStats.useQuery(undefined, {
    staleTime: 1000 * 60 * 10,
  });
}

export function useRequestAnalysis() {
  return trpc.scan.requestAnalysis.useMutation();
}
