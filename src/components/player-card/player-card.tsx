'use client'

import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BunkerWatermark } from '@/components/bunker/bunker-decor'
import { CategoryChip } from '@/features/character/utils/category-style'
import { RarityBadge, traitTileClass } from '@/features/character/utils/rarity-style'
import { cn } from '@/lib/utils'
import type { Player, PlayerCharacteristicView } from '@/lib/api/types'

interface PlayerCardProps {
  player: Player
  characteristics: PlayerCharacteristicView[]
  isSelf?: boolean
  showHiddenAsOwner?: boolean
  compact?: boolean
  /** Trait grid columns (self card = 2 on wide screens) */
  columns?: 1 | 2
  onReveal?: (characteristicId: string) => void
  revealPending?: boolean
  canReveal?: boolean
}

function TraitTile({
  item,
  visible,
  compact,
  inRevealMode,
  canClickReveal,
  stillHidden,
  revealPending,
  onReveal,
}: {
  item: PlayerCharacteristicView
  visible: boolean
  compact: boolean
  inRevealMode: boolean
  canClickReveal: boolean
  stillHidden: boolean
  revealPending: boolean
  onReveal?: (id: string) => void
}) {
  const rarity = item.characteristic.rarity
  const wasRevealed = useRef(item.is_revealed)
  const [justRevealed, setJustRevealed] = useState(false)

  useEffect(() => {
    if (item.is_revealed && !wasRevealed.current) {
      setJustRevealed(true)
      const id = window.setTimeout(() => setJustRevealed(false), 560)
      wasRevealed.current = true
      return () => window.clearTimeout(id)
    }
    wasRevealed.current = item.is_revealed
  }, [item.is_revealed])

  return (
    <div
      className={cn(
        traitTileClass(rarity, {
          revealed: item.is_revealed,
          visible,
        }),
        canClickReveal && 'hover:-translate-y-0.5',
        canClickReveal && !item.is_revealed && 'outline outline-1 outline-amber-500/40',
        justRevealed && 'bunker-trait-reveal',
      )}
    >
      <div
        className={cn(
          'relative z-[1] flex items-start justify-between gap-3',
          compact ? 'px-3 py-2' : 'px-3 py-2.5',
          inRevealMode && 'pr-2',
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {visible ? <RarityBadge rarity={rarity} /> : null}
            <CategoryChip category={item.category} />
            {item.is_revealed ? (
              <span className="rounded-md border border-stone-500/40 bg-stone-950/40 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-stone-300">
                открыто
              </span>
            ) : stillHidden ? (
              <span className="rounded-md border border-stone-700/50 bg-stone-950/50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                скрыто
              </span>
            ) : null}
          </div>
          <p
            className={cn(
              'mt-1.5 text-sm font-medium tracking-wide',
              visible ? 'text-stone-50' : 'font-mono text-stone-500',
            )}
          >
            {visible ? item.characteristic.title : '▮▮▮▮▮▮▮▮'}
          </p>
          {visible && item.characteristic.description && !compact ? (
            <p className="mt-0.5 text-xs leading-relaxed text-stone-400">
              {item.characteristic.description}
            </p>
          ) : null}
        </div>
        {inRevealMode ? (
          <Button
            type="button"
            size="sm"
            className="shrink-0"
            variant={item.is_revealed ? 'secondary' : 'default'}
            disabled={!canClickReveal || revealPending}
            onClick={() => {
              setJustRevealed(true)
              onReveal?.(item.id)
            }}
          >
            {item.is_revealed ? 'Готово' : 'Раскрыть'}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function PlayerCard({
  player,
  characteristics,
  isSelf = false,
  showHiddenAsOwner = false,
  compact = false,
  columns = 1,
  onReveal,
  revealPending = false,
  canReveal = false,
}: PlayerCardProps) {
  const isEliminated = player.status === 'eliminated'

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-xl border border-stone-700/55 bg-stone-950/55 shadow-[inset_0_1px_0_rgba(255,220,170,0.06)]',
        isEliminated && 'opacity-55 grayscale',
        isSelf &&
          'border-amber-600/45 bg-gradient-to-br from-amber-950/40 via-stone-950/70 to-stone-950/80',
      )}
    >
      <span className="bunker-rivet left-2.5 top-2.5" aria-hidden />
      <span className="bunker-rivet right-2.5 top-2.5" aria-hidden />
      <span className="bunker-rivet bottom-2.5 left-2.5" aria-hidden />
      <span className="bunker-rivet bottom-2.5 right-2.5" aria-hidden />
      <BunkerWatermark text={isEliminated ? 'исключён' : 'досье'} />

      <div
        className={cn(
          'relative z-[1] flex items-start justify-between gap-2 border-b border-stone-800/70',
          compact ? 'px-4 py-3' : 'px-4 py-4 sm:px-5',
        )}
      >
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
            {isSelf ? 'Ваше досье' : 'Досье'}
          </p>
          <h3 className="mt-0.5 font-[family-name:var(--font-display)] text-lg tracking-wide text-stone-50 sm:text-xl">
            {player.name}
          </h3>
        </div>
        <div className="flex flex-wrap justify-end gap-1">
          {player.role === 'host' ? <Badge variant="secondary">Ведущий</Badge> : null}
          {isSelf ? <Badge variant="outline">Вы</Badge> : null}
          {isEliminated ? <Badge variant="destructive">Исключён</Badge> : null}
        </div>
      </div>

      <div className={cn('relative z-[1] px-4 pb-4 sm:px-5', compact ? 'pt-3' : 'pt-4')}>
        {characteristics.length === 0 ? (
          <p className="text-sm text-muted-foreground">Характеристики ещё не выданы</p>
        ) : (
          <div className={cn('grid gap-2.5', columns === 2 && 'sm:grid-cols-2')}>
            {characteristics.map((item) => {
              const visible = item.is_revealed || (isSelf && showHiddenAsOwner)
              const inRevealMode = Boolean(onReveal) && isSelf
              const canClickReveal = inRevealMode && canReveal && !item.is_revealed
              const stillHidden = !item.is_revealed && isSelf && showHiddenAsOwner

              return (
                <TraitTile
                  key={item.id}
                  item={item}
                  visible={visible}
                  compact={compact}
                  inRevealMode={inRevealMode}
                  canClickReveal={canClickReveal}
                  stillHidden={stillHidden}
                  revealPending={revealPending}
                  onReveal={onReveal}
                />
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
