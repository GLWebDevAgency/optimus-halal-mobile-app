import { cn } from "@/lib/utils";

type SectionContainerProps = {
  id?: string;
  className?: string;
  children: React.ReactNode;
};

export function SectionContainer({
  id,
  className,
  children,
}: SectionContainerProps) {
  return (
    <section id={id} className={cn("container py-20 sm:py-32", className)}>
      {children}
    </section>
  );
}
