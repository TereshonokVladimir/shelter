import { cn } from '@/lib/utils'
import type { Bunker, Disaster } from '@/lib/api/types'

interface ScenarioBriefProps {
  disaster?: Disaster | null
  bunker?: Bunker | null
  shelterCapacity?: number | null
  className?: string
  /** denser for side rails */
  compact?: boolean
}

/** Катастрофа + убежище with full briefing text (not titles alone). */
export function ScenarioBrief({
  disaster,
  bunker,
  shelterCapacity,
  className,
  compact = false,
}: ScenarioBriefProps) {
  if (!disaster && !bunker) return null

  return (
    <div
      className={cn(
        'grid gap-2',
        compact ? 'grid-cols-1' : 'sm:grid-cols-2',
        className,
      )}
    >
      {disaster ? (
        <article
          className={cn(
            'rounded-lg border border-rose-900/40 bg-rose-950/20',
            compact ? 'px-3 py-2.5' : 'px-3.5 py-3',
          )}
        >
          <p className="text-[10px] uppercase tracking-[0.16em] text-neon-pink">Катастрофа</p>
          <p
            className={cn(
              'text-glitch mt-1 font-[family-name:var(--font-display)] tracking-wide text-stone-50',
              compact ? 'text-sm' : 'text-base sm:text-lg',
            )}
            data-text={disaster.title}
          >
            {disaster.title}
          </p>
          {disaster.description ? (
            <p
              className={cn(
                'mt-2 leading-relaxed text-stone-300',
                compact ? 'text-xs' : 'text-sm',
              )}
            >
              {disaster.description}
            </p>
          ) : null}
        </article>
      ) : null}

      {bunker ? (
        <article
          className={cn(
            'rounded-lg border border-emerald-900/40 bg-emerald-950/20',
            compact ? 'px-3 py-2.5' : 'px-3.5 py-3',
          )}
        >
          <p className="text-[10px] uppercase tracking-[0.16em] text-neon-lime">
            Убежище
            {shelterCapacity != null ? ` · ${shelterCapacity} мест` : ''}
          </p>
          <p
            className={cn(
              'text-neon-lime mt-1 font-[family-name:var(--font-display)] tracking-wide',
              compact ? 'text-sm' : 'text-base sm:text-lg',
            )}
          >
            {bunker.title}
          </p>
          {bunker.description ? (
            <p
              className={cn(
                'mt-2 leading-relaxed text-stone-300',
                compact ? 'text-xs' : 'text-sm',
              )}
            >
              {bunker.description}
            </p>
          ) : null}
        </article>
      ) : null}
    </div>
  )
}
