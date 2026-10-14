'use client';

import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-2xl border border-stone-200 bg-white px-4 py-2 text-base transition-all outline-none placeholder:text-stone-400 focus-visible:border-rose-600 focus-visible:ring-4 focus-visible:ring-rose-600/10 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-stone-50 disabled:opacity-50 aria-invalid:border-rose-600 aria-invalid:ring-4 aria-invalid:ring-rose-600/10 md:text-base",
        className
      )}
      {...props}
    />
  )
}

export { Input }
