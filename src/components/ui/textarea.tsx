import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border border-amber-900/40 bg-stone-950/55 px-3 py-2 text-sm text-stone-100 shadow-[inset_0_1px_0_rgba(251,191,36,0.06)] transition-colors outline-none",
        "placeholder:text-stone-500",
        "focus-visible:border-amber-600/60 focus-visible:ring-3 focus-visible:ring-amber-500/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
