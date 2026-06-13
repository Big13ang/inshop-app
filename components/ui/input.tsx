import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full rounded-2xl border bg-white text-sm shadow-[0_2px_8px_rgba(0,0,0,0.02)] outline-none transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder-zinc-300",
  {
    variants: {
      variant: {
        default: "border-zinc-200/90 focus:border-zinc-950 focus:shadow-[0_0_0_1px_rgba(9,9,11,0.2),0_4px_12px_rgba(0,0,0,0.04)]",
        error: "border-red-400 focus:border-red-500 focus:shadow-[0_0_0_1px_rgba(239,68,68,0.2),0_4px_12px_rgba(239,68,68,0.04)]",
      },
      inputSize: {
        default: "h-12 px-4 py-3",
        lg: "h-14 px-5 py-4 text-base",
        sm: "h-10 px-3 py-2 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  isError?: boolean;
  ref?: React.Ref<HTMLInputElement>;
}

function Input({
  className,
  type = "text",
  variant,
  inputSize = "default",
  isError = false,
  ref,
  ...props
}: InputProps) {
  const activeVariant = isError ? "error" : (variant || "default");
  return (
    <input
      ref={ref}
      type={type}
      className={cn(inputVariants({ variant: activeVariant, inputSize, className }))}
      {...props}
    />
  );
}

export { Input, inputVariants };
