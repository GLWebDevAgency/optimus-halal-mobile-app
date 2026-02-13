import { z } from "zod";
import { randomInt, timingSafeEqual } from "crypto";
import { eq, and, gt, sql } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { users, refreshTokens } from "../../db/schema/index.js";
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} from "../../services/auth.service.js";
import {
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from "../../services/email.service.js";
import { unauthorized, conflict, notFound, badRequest } from "../../lib/errors.js";

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export const authRouter = router({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8).max(128),
        displayName: z.string().min(2).max(100),
        phoneNumber: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const passwordHash = await hashPassword(input.password);

      let user;
      try {
        [user] = await ctx.db
          .insert(users)
          .values({
            email: input.email.toLowerCase(),
            passwordHash,
            displayName: input.displayName,
            phoneNumber: input.phoneNumber,
          })
          .returning({
            id: users.id,
            email: users.email,
            displayName: users.displayName,
          });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("unique") || msg.includes("duplicate") || msg.includes("23505")) {
          throw conflict("Un compte avec cet email existe déjà");
        }
        throw err;
      }

      const accessToken = await signAccessToken(user.id);
      const tokenId = crypto.randomUUID();
      const refreshToken = await signRefreshToken(user.id, tokenId);

      await ctx.db.insert(refreshTokens).values({
        userId: user.id,
        tokenHash: await hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      // Fire-and-forget welcome email (logged on failure)
      sendWelcomeEmail(user.email, user.displayName).catch((err) => {
        console.error("[auth:register] Failed to send welcome email:", {
          email: user.email,
          error: err instanceof Error ? err.message : String(err),
        });
      });

      return {
        user: { id: user.id, email: user.email, displayName: user.displayName },
        accessToken,
        refreshToken,
      };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
        deviceId: z.string().optional(),
        deviceName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.email, input.email.toLowerCase()),
      });

      if (!user || !user.isActive) {
        throw unauthorized("Email ou mot de passe incorrect");
      }

      const valid = await verifyPassword(user.passwordHash, input.password);
      if (!valid) {
        throw unauthorized("Email ou mot de passe incorrect");
      }

      const accessToken = await signAccessToken(user.id);
      const tokenId = crypto.randomUUID();
      const refreshToken = await signRefreshToken(user.id, tokenId);

      // Cap refresh tokens per user (max 10 devices)
      const existingTokens = await ctx.db
        .select({ id: refreshTokens.id })
        .from(refreshTokens)
        .where(eq(refreshTokens.userId, user.id))
        .orderBy(refreshTokens.createdAt)
        .limit(100);

      if (existingTokens.length >= 10) {
        const toDelete = existingTokens.slice(0, existingTokens.length - 9);
        for (const t of toDelete) {
          await ctx.db.delete(refreshTokens).where(eq(refreshTokens.id, t.id));
        }
      }

      await ctx.db.insert(refreshTokens).values({
        userId: user.id,
        tokenHash: await hashToken(refreshToken),
        deviceId: input.deviceId,
        deviceName: input.deviceName,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          level: user.level,
        },
        accessToken,
        refreshToken,
      };
    }),

  refresh: publicProcedure
    .input(z.object({ refreshToken: z.string() }))
    .mutation(async ({ ctx, input }) => {
      let payload;
      try {
        payload = await verifyRefreshToken(input.refreshToken);
      } catch {
        throw unauthorized("Token de rafraîchissement invalide");
      }

      const userId = payload.sub;
      if (!userId) {
        console.error("[auth:refresh] Refresh token missing sub claim");
        throw unauthorized("Token de rafraîchissement invalide");
      }

      const tokenHash = await hashToken(input.refreshToken);

      // Atomic delete-and-check: prevents replay attacks
      const deleted = await ctx.db
        .delete(refreshTokens)
        .where(
          and(
            eq(refreshTokens.tokenHash, tokenHash),
            gt(refreshTokens.expiresAt, new Date())
          )
        )
        .returning({
          id: refreshTokens.id,
          deviceId: refreshTokens.deviceId,
          deviceName: refreshTokens.deviceName,
        });

      if (deleted.length === 0) {
        // Token was already used or doesn't exist — possible replay attack
        // Invalidate ALL tokens for this user as a safety measure
        await ctx.db
          .delete(refreshTokens)
          .where(eq(refreshTokens.userId, userId));
        console.warn("[auth:refresh] Possible token replay detected for user:", userId);
        throw unauthorized("Token de rafraîchissement invalide ou déjà utilisé");
      }

      const storedToken = deleted[0];
      const accessToken = await signAccessToken(userId);
      const newTokenId = crypto.randomUUID();
      const newRefreshToken = await signRefreshToken(userId, newTokenId);

      await ctx.db.insert(refreshTokens).values({
        userId,
        tokenHash: await hashToken(newRefreshToken),
        deviceId: storedToken.deviceId,
        deviceName: storedToken.deviceName,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      return { accessToken, refreshToken: newRefreshToken };
    }),

  logout: protectedProcedure
    .input(z.object({ refreshToken: z.string().optional() }).optional())
    .mutation(async ({ ctx, input }) => {
      if (input?.refreshToken) {
        const tokenHash = await hashToken(input.refreshToken);
        await ctx.db
          .delete(refreshTokens)
          .where(eq(refreshTokens.tokenHash, tokenHash));
      } else {
        await ctx.db
          .delete(refreshTokens)
          .where(eq(refreshTokens.userId, ctx.userId));
      }
      return { success: true };
    }),

  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.email, input.email.toLowerCase()),
      });

      // Always return success (don't leak email existence)
      if (!user) return { success: true };

      const resetCode = randomInt(100000, 1000000).toString();
      const emailKey = input.email.toLowerCase();
      const attemptsKey = `pwd-reset-attempts:${emailKey}`;

      await ctx.redis.setex(`pwd-reset:${emailKey}`, 900, resetCode);
      await ctx.redis.del(attemptsKey); // Reset attempts on new code

      const emailSent = await sendPasswordResetEmail(input.email, resetCode);
      if (!emailSent) {
        console.error("[auth:requestPasswordReset] Failed to send reset email:", emailKey);
      }

      return { success: true };
    }),

  resetPassword: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        code: z.string().length(6),
        newPassword: z.string().min(8).max(128),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const emailKey = input.email.toLowerCase();
      const key = `pwd-reset:${emailKey}`;
      const attemptsKey = `pwd-reset-attempts:${emailKey}`;

      // Brute-force protection: max 5 attempts
      const attempts = await ctx.redis.incr(attemptsKey);
      if (attempts === 1) {
        await ctx.redis.expire(attemptsKey, 900);
      }
      if (attempts > 5) {
        await ctx.redis.del(key);
        await ctx.redis.del(attemptsKey);
        throw badRequest("Trop de tentatives. Veuillez demander un nouveau code.");
      }

      const storedCode = await ctx.redis.get(key);

      // Constant-time comparison to prevent timing attacks
      if (!storedCode || !safeCompare(storedCode, input.code)) {
        throw badRequest("Code invalide ou expiré");
      }

      const user = await ctx.db.query.users.findFirst({
        where: eq(users.email, emailKey),
      });

      if (!user) throw notFound("Utilisateur introuvable");

      const passwordHash = await hashPassword(input.newPassword);

      await ctx.db
        .update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, user.id));

      // Invalidate all refresh tokens
      await ctx.db
        .delete(refreshTokens)
        .where(eq(refreshTokens.userId, user.id));

      await ctx.redis.del(key);
      await ctx.redis.del(attemptsKey);
      return { success: true };
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.userId),
    });

    if (!user) throw notFound("Utilisateur introuvable");

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }),
});
