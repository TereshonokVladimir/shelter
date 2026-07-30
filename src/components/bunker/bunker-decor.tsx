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
