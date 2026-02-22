import * as jose from "jose";
import argon2 from "argon2";
import { env } from "../lib/env.js";

const accessSecret = new TextEncoder().encode(env.JWT_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

// ── Password Hashing ──────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4,
  });
}

export async function verifyPassword(
  hash: string,
  password: string
): Promise<boolean> {
  if (!hash) return false;
  return argon2.verify(hash, password);
}

// ── JWT Access Tokens ─────────────────────────────────────

export async function signAccessToken(userId: string): Promise<string> {
  return new jose.SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_EXPIRY)
    .setIssuer("naqiy")
    .setAudience("mobile")
    .sign(accessSecret);
}

export async function verifyAccessToken(
  token: string
): Promise<jose.JWTPayload> {
  const { payload } = await jose.jwtVerify(token, accessSecret, {
    issuer: "naqiy",
    audience: "mobile",
  });
  return payload;
}

// ── JWT Refresh Tokens ────────────────────────────────────

export async function signRefreshToken(
  userId: string,
  tokenId: string
): Promise<string> {
  return new jose.SignJWT({ sub: userId, jti: tokenId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_EXPIRY)
    .setIssuer("naqiy")
    .setAudience("mobile-refresh")
    .sign(refreshSecret);
}

export async function verifyRefreshToken(
  token: string
): Promise<jose.JWTPayload> {
  const { payload } = await jose.jwtVerify(token, refreshSecret, {
    issuer: "naqiy",
    audience: "mobile-refresh",
  });
  return payload;
}

// ── Token Hash (for DB storage) ───────────────────────────

export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
