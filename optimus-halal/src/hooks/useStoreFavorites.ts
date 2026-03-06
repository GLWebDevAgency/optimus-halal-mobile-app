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
      const previousList = queryClient.getQueriesData({ queryKey: [["store", "listFavorites"]] });
      const previousIsFav = queryClient.getQueriesData({ queryKey: [["store", "isStoreFavorite"]] });

      // Optimistically mark as favorite in isStoreFavorite cache
      queryClient.setQueriesData(
        { queryKey: [["store", "isStoreFavorite"]] },
        (old: any) => {
          if (old && typeof old === "object" && "storeId" in old && old.storeId === variables.storeId) {
            return { ...old, isFavorite: true };
          }
          return old;
        }
      );

      return { previousList, previousIsFav };
    },
    onSuccess: (_data, variables) => {
      trackEvent("add_store_favorite", { storeId: variables.storeId });
    },
    onError: (_err, _variables, context) => {
      if (context?.previousList) {
        for (const [queryKey, data] of context.previousList) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      if (context?.previousIsFav) {
        for (const [queryKey, data] of context.previousIsFav) {
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
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: [["store", "listFavorites"]] });
      await queryClient.cancelQueries({ queryKey: [["store", "isStoreFavorite"]] });
      const previousList = queryClient.getQueriesData({ queryKey: [["store", "listFavorites"]] });
      const previousIsFav = queryClient.getQueriesData({ queryKey: [["store", "isStoreFavorite"]] });

      // Optimistically remove from list cache
      queryClient.setQueriesData(
        { queryKey: [["store", "listFavorites"]] },
        (old: any) => {
          if (!Array.isArray(old)) return old;
          return old.filter((f: any) => f.storeId !== variables.storeId);
        }
      );

      // Optimistically mark as not favorite
      queryClient.setQueriesData(
        { queryKey: [["store", "isStoreFavorite"]] },
        (old: any) => {
          if (old && typeof old === "object" && "storeId" in old && old.storeId === variables.storeId) {
            return { ...old, isFavorite: false };
          }
          return old;
        }
      );

      return { previousList, previousIsFav };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousList) {
        for (const [queryKey, data] of context.previousList) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      if (context?.previousIsFav) {
        for (const [queryKey, data] of context.previousIsFav) {
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
