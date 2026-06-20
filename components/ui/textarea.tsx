import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const textareaVariants = cva(
  "flex w-full rounded-2xl border bg-white text-sm shadow-[0_2px_8px_rgba(0,0,0,0.02)] outline-none transition-all duration-300 resize-none leading-relaxed disabled:cursor-not-allowed disabled:opacity-50 placeholder-zinc-300",
  {
    variants: {
      variant: {
        default:
          "border-zinc-200/90 focus:border-zinc-950 focus:shadow-[0_0_0_1px_rgba(9,9,11,0.2),0_4px_12px_rgba(0,0,0,0.04)]",
        error:
          "border-red-400 focus:border-red-500 focus:shadow-[0_0_0_1px_rgba(239,68,68,0.2),0_4px_12px_rgba(239,68,68,0.04)]",
      },
      textareaSize: {
        default: "px-4 py-3",
        lg: "px-5 py-4 text-base",
        sm: "px-3 py-2 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      textareaSize: "default",
    },
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  VariantProps<typeof textareaVariants> {
  isError?: boolean;
  errorMessage?: string;
  ref?: React.Ref<HTMLTextAreaElement>;
}

function Textarea({
  className,
  variant,
  textareaSize = "default",
  isError = false,
  errorMessage,
  ref,
  ...props
}: TextareaProps) {
  const activeVariant = isError ? "error" : (variant || "default");

  return (
    <div className="flex flex-col gap-1">
      <textarea
        ref={ref}
        className={cn(
          textareaVariants({ variant: activeVariant, textareaSize, className })
        )}
        {...props}
      />

      <div className="px-1 text-[11px] min-h-[16px] transition-all duration-300">
        {isError && errorMessage ? (
          <span className="text-red-500 font-medium">{errorMessage}</span>
        ) : null}
      </div>
    </div>
  );
}

export { Textarea, textareaVariants };
