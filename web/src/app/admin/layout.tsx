import type { Metadata } from "next";
import { AdminLayout } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: { default: "Admin — Naqiy", template: "%s | Admin Naqiy" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
