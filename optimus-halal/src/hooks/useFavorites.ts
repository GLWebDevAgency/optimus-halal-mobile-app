import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";
import { trackEvent } from "../lib/analytics";
import { useMe } from "./useAuth";

export function useFavoritesList(options?: {
  folderId?: string;
  limit?: number;
  enabled?: boolean;
}) {
  const { data: me } = useMe();
  return trpc.favorites.list.useQuery(
    {
      folderId: options?.folderId,
      limit: options?.limit ?? 50,
    },
    {
      staleTime: 1000 * 60 * 5,
      enabled: (options?.enabled ?? true) && !!me,
      retry: false,
    }
  );
}

export function useAddFavorite() {
  const queryClient = useQueryClient();

  return trpc.favorites.add.useMutation({
    onMutate: async (variables) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: [["favorites"]] });

      // Snapshot previous value for rollback
      const previousData = queryClient.getQueriesData({ queryKey: [["favorites"]] });

      // Optimistically add to every favorites list cache
      queryClient.setQueriesData(
        { queryKey: [["favorites"]] },
        (old: any) => {
          if (!Array.isArray(old)) return old;
          // Prevent duplicates
          if (old.some((f: any) => f.productId === variables.productId)) return old;
          return [
            {
              id: `optimistic-${Date.now()}`,
              productId: variables.productId,
              folderId: variables.folderId ?? null,
              notes: null,
              createdAt: new Date().toISOString(),
              product: null, // Will be filled on refetch
            },
            ...old,
          ];
        }
      );

      return { previousData };
    },
    onSuccess: (_data, variables) => {
      trackEvent("add_favorite", { productId: variables.productId });
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        for (const [queryKey, data] of context.previousData) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onSettled: () => {
      // Always refetch to get server truth
      queryClient.invalidateQueries({ queryKey: [["favorites"]] });
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return trpc.favorites.remove.useMutation({
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: [["favorites"]] });

      const previousData = queryClient.getQueriesData({ queryKey: [["favorites"]] });

      // Optimistically remove from every favorites list cache
      queryClient.setQueriesData(
        { queryKey: [["favorites"]] },
        (old: any) => {
          if (!Array.isArray(old)) return old;
          return old.filter((f: any) => f.productId !== variables.productId);
        }
      );

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        for (const [queryKey, data] of context.previousData) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [["favorites"]] });
    },
  });
}

export function useFavoriteFolders() {
  const { data: me } = useMe();
  return trpc.favorites.listFolders.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    enabled: !!me,
    retry: false,
  });
}

export function useCreateFavoriteFolder() {
  const queryClient = useQueryClient();

  return trpc.favorites.createFolder.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["favorites"]] });
    },
  });
}

export function useMoveFavoriteToFolder() {
  const queryClient = useQueryClient();

  return trpc.favorites.moveToFolder.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["favorites"]] });
    },
  });
}
