'use client'

import { cn } from '@/lib/utils'

interface ReadyClearanceToggleProps {
  ready: boolean
  disabled?: boolean
  onToggle: () => void
  className?: string
}

/**
 * Airlock clearance seal — both labels always visible, fixed width (no footer jump).
 * Metaphor: seal the hatch before the operation starts.
 */
export function ReadyClearanceToggle({
  ready,
  disabled,
  onToggle,
  className,
}: ReadyClearanceToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ready}
      aria-label={ready ? 'Снять готовность' : 'Подтвердить готовность'}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        'relative inline-grid h-10 w-[13.75rem] shrink-0 grid-cols-2 items-center rounded-md border border-amber-900/50 bg-stone-950/80 p-0.5 font-mono text-[11px] uppercase tracking-[0.14em] shadow-[inset_0_1px_0_rgba(251,191,36,0.06)] transition-opacity outline-none select-none',
        'focus-visible:border-amber-600/60 focus-visible:ring-3 focus-visible:ring-amber-500/20',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-[5px] border transition-transform duration-200 ease-out',
          ready
            ? 'translate-x-full border-emerald-700/55 bg-emerald-950/80 shadow-[inset_0_0_12px_rgba(16,185,129,0.15)]'
            : 'translate-x-0 border-amber-800/50 bg-stone-900/90 shadow-[inset_0_0_12px_rgba(245,158,11,0.08)]',
        )}
      />
      <span
        className={cn(
          'relative z-[1] text-center transition-colors',
          ready ? 'text-stone-500' : 'font-semibold text-amber-100',
        )}
      >
        Ожидание
      </span>
      <span
        className={cn(
          'relative z-[1] text-center transition-colors',
          ready ? 'font-semibold text-emerald-200' : 'text-stone-500',
        )}
      >
        Допуск
      </span>
    </button>
  )
}

interface SquadClearanceMeterProps {
  ready: number
  total: number
  className?: string
}

/** Segmented hatch seals — how many players locked in. */
export function SquadClearanceMeter({ ready, total, className }: SquadClearanceMeterProps) {
  const slots = Math.max(total, 1)
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="bunker-label">Шлюз · допуск</p>
        <p className="font-mono text-[11px] tabular-nums text-stone-400">
          <span className={ready === total && total > 0 ? 'text-emerald-300' : 'text-amber-200'}>
            {ready}
          </span>
          <span className="text-stone-600"> / {total}</span>
        </p>
      </div>
      <div
        className="flex h-2 gap-1"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={ready}
        aria-label="Готовность отряда"
      >
        {Array.from({ length: slots }, (_, i) => (
          <span
            key={i}
            className={cn(
              'h-full min-w-0 flex-1 rounded-[2px] border transition-colors duration-300',
              i < ready
                ? 'border-emerald-700/50 bg-emerald-500/70 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                : 'border-stone-700/40 bg-stone-900/80',
            )}
          />
        ))}
      </div>
    </div>
  )
}
