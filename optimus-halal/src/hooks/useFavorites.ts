import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";

export function useFavoritesList(options?: {
  folderId?: string;
  limit?: number;
}) {
  return trpc.favorites.list.useQuery(
    {
      folderId: options?.folderId,
      limit: options?.limit ?? 50,
    },
    { staleTime: 1000 * 60 * 5 }
  );
}

export function useAddFavorite() {
  const queryClient = useQueryClient();

  return trpc.favorites.add.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["favorites"]] });
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return trpc.favorites.remove.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["favorites"]] });
    },
  });
}

export function useFavoriteFolders() {
  return trpc.favorites.listFolders.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
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
