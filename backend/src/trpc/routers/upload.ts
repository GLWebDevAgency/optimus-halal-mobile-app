import { z } from "zod";
import { randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc.js";
import {
  getPresignedUploadUrl,
  getPublicUrl,
  deleteObject,
} from "../../services/r2.service.js";

const UPLOAD_CONFIG = {
  avatar: { maxSize: 2 * 1024 * 1024, path: "avatars" },
  report: { maxSize: 5 * 1024 * 1024, path: "reports" },
} as const;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const uploadRouter = router({
  getPresignedUrl: protectedProcedure
    .input(
      z.object({
        type: z.enum(["avatar", "report"]),
        contentType: z
          .string()
          .refine((ct) => ALLOWED_TYPES.includes(ct), {
            message: "Type de fichier non autorisé (JPEG, PNG, WebP uniquement)",
          }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const config = UPLOAD_CONFIG[input.type];
      const ext = input.contentType.split("/")[1] === "png" ? "png" : "webp";
      const key = `${config.path}/${ctx.userId}/${randomUUID()}.${ext}`;

      const uploadUrl = await getPresignedUploadUrl(
        key,
        input.contentType,
      );

      return {
        uploadUrl,
        cdnUrl: getPublicUrl(key),
        key,
      };
    }),

  deleteImage: protectedProcedure
    .input(z.object({ key: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // Strict ownership check: key must start with a known prefix + userId
      const isOwned =
        input.key.startsWith(`avatars/${ctx.userId}/`) ||
        input.key.startsWith(`reports/${ctx.userId}/`);
      if (!isOwned) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Non autorisé à supprimer cette image",
        });
      }
      await deleteObject(input.key);
      return { success: true as const };
    }),
});
