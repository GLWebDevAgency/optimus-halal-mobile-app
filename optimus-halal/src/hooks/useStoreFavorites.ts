import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";
import { trackEvent } from "../lib/analytics";
import { useMe } from "./useAuth";

export function useStoreFavoritesList(options?: {
  limit?: number;
  enabled?: boolean;
}) {
  const { data: me } = useMe();
  return trpc.store.listFavorites.useQuery(
    { limit: options?.limit ?? 50 },
    {
      staleTime: 1000 * 60 * 5,
      enabled: (options?.enabled ?? true) && !!me,
      retry: false,
    }
  );
}

export function useAddStoreFavorite() {
  const queryClient = useQueryClient();

  return trpc.store.addFavorite.useMutation({
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: [["store", "listFavorites"]] });
      await queryClient.cancelQueries({ queryKey: [["store", "isStoreFavorite"]] });
      const previousData = queryClient.getQueriesData({ queryKey: [["store", "listFavorites"]] });
      return { previousData };
    },
    onSuccess: (_data, variables) => {
      trackEvent("add_store_favorite", { storeId: variables.storeId });
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        for (const [queryKey, data] of context.previousData) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [["store", "listFavorites"]] });
      queryClient.invalidateQueries({ queryKey: [["store", "isStoreFavorite"]] });
    },
  });
}

export function useRemoveStoreFavorite() {
  const queryClient = useQueryClient();

  return trpc.store.removeFavorite.useMutation({
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [["store", "listFavorites"]] });
      queryClient.invalidateQueries({ queryKey: [["store", "isStoreFavorite"]] });
    },
  });
}

export function useIsStoreFavorite(storeId: string | null) {
  const { data: me } = useMe();
  return trpc.store.isStoreFavorite.useQuery(
    { storeId: storeId! },
    {
      enabled: !!me && !!storeId,
      staleTime: 1000 * 60 * 5,
    }
  );
}
