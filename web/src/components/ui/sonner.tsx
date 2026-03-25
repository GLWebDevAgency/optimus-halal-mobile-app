"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      expand={false}
      richColors
      closeButton
      offset={16}
      toastOptions={{
        className: "!font-sans",
        style: {
          borderRadius: "1rem",
          padding: "14px 18px",
          fontSize: "0.875rem",
          fontWeight: 500,
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
          border: "1px solid oklch(0.76 0.14 88 / 0.15)",
        },
      }}
    />
  );
}
