import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@backend/trpc/router";

export const trpc = createTRPCReact<AppRouter>();

export type { AppRouter };
