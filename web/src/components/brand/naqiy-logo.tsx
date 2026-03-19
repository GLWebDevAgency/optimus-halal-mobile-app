import { cn } from "@/lib/utils";

type NaqiyLogoProps = {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
};

const sizeMap = {
  sm: { icon: "size-7", text: "text-base", arabic: "text-xs" },
  md: { icon: "size-9", text: "text-xl", arabic: "text-sm" },
  lg: { icon: "size-12", text: "text-2xl", arabic: "text-lg" },
  xl: { icon: "size-16", text: "text-4xl", arabic: "text-xl" },
} as const;

export function NaqiyLogo({
  size = "md",
  showText = true,
  className,
}: NaqiyLogoProps) {
  const s = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          s.icon,
          "flex items-center justify-center rounded-xl bg-primary gold-glow"
        )}
      >
        <span
          className={cn(s.arabic, "font-black text-primary-foreground")}
        >
          ن
        </span>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={cn(s.text, "font-bold tracking-tight")}>
            Naqiy
          </span>
          {size !== "sm" && (
            <span className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
              نقيّ
            </span>
          )}
        </div>
      )}
    </div>
  );
}
