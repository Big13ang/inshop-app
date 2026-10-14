import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-base transition-all outline-none placeholder:text-stone-400 focus-visible:border-rose-600 focus-visible:ring-4 focus-visible:ring-rose-600/10 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:opacity-50 aria-invalid:border-rose-600 aria-invalid:ring-4 aria-invalid:ring-rose-600/10 md:text-base",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
