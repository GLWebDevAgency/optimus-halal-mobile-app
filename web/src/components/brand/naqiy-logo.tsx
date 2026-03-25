import Image from "next/image";
import { cn } from "@/lib/utils";

type NaqiyLogoProps = {
  size?: "sm" | "md" | "lg" | "xl";
  /** "icon" = N only, "full" = wordmark image, "brand" = icon + text */
  variant?: "icon" | "full" | "brand";
  className?: string;
};

const iconSizeMap = {
  sm: { w: 32, h: 32, cls: "size-8" },
  md: { w: 40, h: 40, cls: "size-10" },
  lg: { w: 52, h: 52, cls: "size-13" },
  xl: { w: 64, h: 64, cls: "size-16" },
} as const;

const fullSizeMap = {
  sm: { w: 100, h: 34, cls: "h-[34px]" },
  md: { w: 120, h: 40, cls: "h-10" },
  lg: { w: 150, h: 52, cls: "h-13" },
  xl: { w: 200, h: 64, cls: "h-16" },
} as const;

const brandTextMap = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-4xl",
} as const;

export function NaqiyLogo({
  size = "md",
  variant = "brand",
  className,
}: NaqiyLogoProps) {
  if (variant === "icon") {
    const s = iconSizeMap[size];
    return (
      <Image
        src="/images/logo_naqiy.webp"
        alt="Naqiy"
        width={s.w}
        height={s.h}
        className={cn(s.cls, "object-contain", className)}
        priority
      />
    );
  }

  if (variant === "full") {
    const s = fullSizeMap[size];
    return (
      <Image
        src="/images/logo_naqiy_full.png"
        alt="Naqiy"
        width={s.w}
        height={s.h}
        className={cn(s.cls, "w-auto object-contain", className)}
        priority
      />
    );
  }

  // variant === "brand" — icon N + text "Naqiy"
  const iconS = iconSizeMap[size];
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src="/images/logo_naqiy.webp"
        alt=""
        width={iconS.w}
        height={iconS.h}
        className={cn(iconS.cls, "object-contain")}
        priority
      />
      <span className={cn(brandTextMap[size], "font-display font-bold tracking-tight text-foreground")}>
        Naqiy
      </span>
    </div>
  );
}
