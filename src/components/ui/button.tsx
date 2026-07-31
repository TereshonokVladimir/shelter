import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap tracking-wide transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-amber-700/70 bg-gradient-to-b from-amber-500 to-amber-700 text-stone-950 shadow-[inset_0_1px_0_rgba(253,224,71,0.45),0_1px_0_rgba(0,0,0,0.35)] hover:from-amber-400 hover:to-amber-600 hover:border-amber-500/80",
        outline:
          "border-amber-800/55 bg-stone-950/55 text-amber-100 shadow-[inset_0_1px_0_rgba(251,191,36,0.08)] hover:border-amber-600/70 hover:bg-amber-950/40 hover:text-amber-50 aria-expanded:bg-amber-950/50 aria-expanded:text-amber-50",
        secondary:
          "border-stone-600/50 bg-stone-800/80 text-stone-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-stone-700/90 hover:border-stone-500/60 aria-expanded:bg-stone-700 aria-expanded:text-stone-50",
        ghost:
          "text-stone-300 hover:bg-amber-950/35 hover:text-amber-50 aria-expanded:bg-amber-950/40 aria-expanded:text-amber-50",
        destructive:
          "border-rose-800/50 bg-rose-950/55 text-rose-100 hover:bg-rose-900/60 focus-visible:border-rose-500/40 focus-visible:ring-rose-500/25",
        hazard:
          "border-amber-950/90 bg-[repeating-linear-gradient(-45deg,rgba(245,158,11,0.75),rgba(245,158,11,0.75)_6px,rgba(28,25,23,0.95)_6px,rgba(28,25,23,0.95)_12px)] text-amber-50 shadow-[inset_0_1px_0_rgba(253,224,71,0.25)] hover:brightness-110",
        link: "text-amber-300 underline-offset-4 hover:text-amber-200 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-1.5 px-4 text-[0.95rem] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
