import { trpc } from "@/lib/trpc";

export function useCreateReview() {
  const utils = trpc.useUtils();
  return trpc.report.createReview.useMutation({
    onSuccess: () => {
      utils.report.invalidate();
    },
  });
}

export function useProductReviews(productId: string, limit = 10) {
  return trpc.report.getProductReviews.useQuery(
    { productId, limit, offset: 0 },
    { enabled: !!productId, staleTime: 1000 * 60 * 5 }
  );
}

export function useMarkHelpful() {
  return trpc.report.markHelpful.useMutation();
}
