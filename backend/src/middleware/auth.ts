import { createMiddleware } from "hono/factory";
import { verifyAccessToken } from "../services/auth.service.js";

export const authMiddleware = createMiddleware(async (c, next) => {
  const authorization = c.req.header("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.slice(7);
    try {
      const payload = await verifyAccessToken(token);
      c.set("userId", payload.sub ?? null);
    } catch {
      c.set("userId", null);
    }
  } else {
    c.set("userId", null);
  }
  await next();
});
