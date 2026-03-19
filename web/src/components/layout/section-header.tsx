import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type SectionHeaderProps = {
  subTitle?: string;
  title: string;
  description?: string;
  className?: string;
};

export function SectionHeader({
  subTitle,
  title,
  description,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center gap-4",
        className
      )}
    >
      {subTitle && (
        <Badge variant="outline" className="text-gold border-gold/30 bg-gold/5">
          {subTitle}
        </Badge>
      )}
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">{title}</h2>
      {description && (
        <p className="text-muted-foreground text-lg max-w-2xl">
          {description}
        </p>
      )}
    </div>
  );
}
