'use client'

import { Toaster as Sonner, type ToasterProps } from 'sonner'
import {
  CircleCheckIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
  RadioIcon,
} from 'lucide-react'

/**
 * System toasts — bunker console aesthetic (dark ash + amber hazard).
 * App is always dark; no ThemeProvider required.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="top-center"
      gap={10}
      visibleToasts={4}
      icons={{
        success: <CircleCheckIcon className="size-4 text-emerald-400" />,
        info: <RadioIcon className="size-4 text-amber-400" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-300" />,
        error: <OctagonXIcon className="size-4 text-red-400" />,
        loading: <Loader2Icon className="size-4 animate-spin text-amber-400/80" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            'cn-toast bunker-toast relative flex w-[min(100vw-1.5rem,24rem)] items-start gap-3 overflow-hidden border border-amber-900/50 bg-stone-950/95 pt-3.5 text-stone-100 shadow-[0_12px_40px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(251,191,36,0.08)] backdrop-blur-md',
          title: 'font-medium tracking-wide text-stone-50',
          description: 'text-sm text-stone-400',
          actionButton:
            'rounded-md border border-amber-700/50 bg-amber-950/60 px-2.5 py-1 text-xs font-medium text-amber-100',
          cancelButton:
            'rounded-md border border-stone-700/60 bg-stone-900/80 px-2.5 py-1 text-xs text-stone-300',
          success: 'border-emerald-800/45',
          error: 'border-red-900/50',
          warning: 'border-amber-700/55',
          info: 'border-amber-900/50',
          loading: 'border-amber-900/40',
          icon: 'mt-0.5',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
