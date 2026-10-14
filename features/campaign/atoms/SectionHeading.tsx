import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  badge: string;
  title: string;
  description?: string;
  light?: boolean;
  className?: string;
}

export const SectionHeading = ({ badge, title, description, light = false, className }: SectionHeadingProps) => (
  <div className={cn("text-center mb-16 max-w-3xl mx-auto", className)}>
    <h2 className="text-base font-bold text-rose-600 mb-4 uppercase tracking-[0.2em]">{badge}</h2>
    <p className={cn("text-4xl md:text-5xl font-display mb-6", light ? "text-white" : "text-stone-900")}>{title}</p>
    {description && (
      <p className={cn("text-lg", light ? "text-stone-300" : "text-stone-500")}>
        {description}
      </p>
    )}
  </div>
);
