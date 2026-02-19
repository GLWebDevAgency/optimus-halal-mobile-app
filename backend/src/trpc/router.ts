import { router } from "./trpc.js";
import { authRouter } from "./routers/auth.js";
import { profileRouter } from "./routers/profile.js";
import { scanRouter } from "./routers/scan.js";
import { productRouter } from "./routers/product.js";
import { favoritesRouter } from "./routers/favorites.js";
import { alertRouter } from "./routers/alert.js";
import { storeRouter } from "./routers/store.js";
import { notificationRouter } from "./routers/notification.js";
import { loyaltyRouter } from "./routers/loyalty.js";
import { reportRouter } from "./routers/report.js";
import { statsRouter } from "./routers/stats.js";
import { boycottRouter } from "./routers/boycott.js";
import { certifierRouter } from "./routers/certifier.js";
import { articleRouter } from "./routers/article.js";
import { additiveRouter } from "./routers/additive.js";
import { uploadRouter } from "./routers/upload.js";
import { subscriptionRouter } from "./routers/subscription.js";

export const appRouter = router({
  auth: authRouter,
  profile: profileRouter,
  scan: scanRouter,
  product: productRouter,
  favorites: favoritesRouter,
  alert: alertRouter,
  store: storeRouter,
  notification: notificationRouter,
  loyalty: loyaltyRouter,
  report: reportRouter,
  stats: statsRouter,
  boycott: boycottRouter,
  certifier: certifierRouter,
  article: articleRouter,
  additive: additiveRouter,
  upload: uploadRouter,
  subscription: subscriptionRouter,
});

export type AppRouter = typeof appRouter;
