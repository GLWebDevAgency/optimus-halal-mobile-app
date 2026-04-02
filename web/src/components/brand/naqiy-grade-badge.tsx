import { cn } from "@/lib/utils";

export interface TrustGrade {
  grade: number;
  arabic: string;
  label: string;
  color: string;
}

export const TRUST_GRADES: readonly TrustGrade[] = [
  { grade: 1, arabic: "١", label: "Très fiable", color: "#22c55e" },
  { grade: 2, arabic: "٢", label: "Fiable", color: "#84cc16" },
  { grade: 3, arabic: "٣", label: "Vigilance", color: "#f59e0b" },
  { grade: 4, arabic: "٤", label: "Peu fiable", color: "#f97316" },
  { grade: 5, arabic: "٥", label: "Pas fiable", color: "#ef4444" },
] as const;

export function getTrustGradeFromScore(score: number): TrustGrade {
  if (score >= 90) return TRUST_GRADES[0];
  if (score >= 70) return TRUST_GRADES[1];
  if (score >= 51) return TRUST_GRADES[2];
  if (score >= 35) return TRUST_GRADES[3];
  return TRUST_GRADES[4];
}

type StripProps = {
  variant: "strip";
  grade: TrustGrade;
  showLabel?: boolean;
  className?: string;
};

type CompactProps = {
  variant: "compact";
  grade: TrustGrade;
  showLabel?: boolean;
  className?: string;
};

type MicroProps = {
  variant: "micro";
  grade: TrustGrade;
  className?: string;
};

export type NaqiyGradeBadgeProps = StripProps | CompactProps | MicroProps;

export function NaqiyGradeBadge(props: NaqiyGradeBadgeProps) {
  if (props.variant === "strip") {
    return (
      <GradeStrip
        grade={props.grade}
        showLabel={props.showLabel ?? true}
        className={props.className}
      />
    );
  }

  if (props.variant === "compact") {
    return (
      <GradeCompact
        grade={props.grade}
        showLabel={props.showLabel ?? false}
        className={props.className}
      />
    );
  }

  return <GradeMicro grade={props.grade} className={props.className} />;
}

function GradeStrip({
  grade,
  showLabel,
  className,
}: {
  grade: TrustGrade;
  showLabel: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <img src="/images/logo_naqiy.webp" alt="N" className="mr-0.5 h-4 w-4" />

      {TRUST_GRADES.map((g) => {
        const isActive = g.grade === grade.grade;
        return (
          <div
            key={g.grade}
            className={cn(
              "flex items-center justify-center rounded-md transition-all",
              isActive ? "h-7 w-11" : "size-6 opacity-20"
            )}
            style={{ backgroundColor: g.color }}
          >
            <span
              className={cn(
                "font-black text-white",
                isActive ? "text-sm" : "text-[10px]"
              )}
            >
              {g.arabic}
            </span>
          </div>
        );
      })}

      {showLabel && (
        <span
          className="ml-2 text-xs font-semibold"
          style={{ color: grade.color }}
        >
          {grade.label}
        </span>
      )}
    </div>
  );
}

function GradeCompact({
  grade,
  showLabel,
  className,
}: {
  grade: TrustGrade;
  showLabel: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div
        className="flex items-center gap-0.5 rounded-lg px-2 py-1"
        style={{ backgroundColor: grade.color }}
      >
        <img src="/images/logo_naqiy.webp" alt="N" className="h-3 w-3" />
        <span className="text-sm font-black text-white">{grade.arabic}</span>
      </div>
      {showLabel && (
        <span
          className="text-xs font-semibold"
          style={{ color: grade.color }}
        >
          {grade.label}
        </span>
      )}
    </div>
  );
}

function GradeMicro({
  grade,
  className,
}: {
  grade: TrustGrade;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-px rounded-md px-1.5 py-0.5",
        className
      )}
      style={{ backgroundColor: grade.color }}
    >
      <img src="/images/logo_naqiy.webp" alt="N" className="h-2.5 w-2.5" />
      <span className="text-[11px] font-black text-white">{grade.arabic}</span>
    </div>
  );
}
