import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Corner brackets + optional stamp — atmospheric chrome without cluttering layout. */
export function BunkerFrame({
  className,
  children,
  stamp,
}: {
  className?: string
  children?: ReactNode
  stamp?: string
}) {
  return (
    <div className={cn('pointer-events-none relative', className)} aria-hidden>
      <span className="bunker-corner bunker-corner-tl" />
      <span className="bunker-corner bunker-corner-tr" />
      <span className="bunker-corner bunker-corner-bl" />
      <span className="bunker-corner bunker-corner-br" />
      {stamp ? (
        <span className="bunker-stamp absolute top-3 right-3 max-w-[9rem] text-right">
          {stamp}
        </span>
      ) : null}
      {children}
    </div>
  )
}

export function BunkerWatermark({ text, className }: { text: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden',
        className,
      )}
    >
      <span className="bunker-watermark select-none">{text}</span>
    </span>
  )
}

/** Card shell with hazard tape header + crop grain. Inner content must add its own padding. */
export function BunkerPanel({
  className,
  children,
  label,
  softTape = false,
  contentClassName,
}: {
  className?: string
  children: ReactNode
  label?: string
  softTape?: boolean
  contentClassName?: string
}) {
  return (
    <div className={cn('bunker-panel', className)}>
      <div
        className={cn(softTape ? 'bunker-hazard-stripe-soft h-1.5' : 'bunker-hazard-stripe h-1.5')}
        aria-hidden
      />
      {label ? (
        <div className="border-b border-amber-900/25 px-4 pt-3 pb-2 sm:px-5">
          <p className="bunker-label">{label}</p>
        </div>
      ) : null}
      <div className={cn('relative z-[1] p-4 sm:p-5', contentClassName)}>{children}</div>
    </div>
  )
}
