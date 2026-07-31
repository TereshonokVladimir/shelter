'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Eye, Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { BunkerWatermark } from '@/components/bunker/bunker-decor'
import { categoryIcon, categoryLabel } from '@/features/character/utils/category-style'
import {
  normalizeTraitRarity,
  RARITY_ICON,
  RARITY_LABELS,
  traitTileClass,
} from '@/features/character/utils/rarity-style'
import { cn } from '@/lib/utils'
import type { Player, PlayerCharacteristicView } from '@/lib/api/types'

interface PlayerCardProps {
  player: Player
  characteristics: PlayerCharacteristicView[]
  isSelf?: boolean
  showHiddenAsOwner?: boolean
  compact?: boolean
  columns?: 1 | 2
  /** Highlight as the current speaker (for observers). */
  spotlight?: boolean
  onReveal?: (characteristicId: string) => void
  revealPending?: boolean
  canReveal?: boolean
}

function TraitTile({
  item,
  visible,
  inRevealMode,
  canClickReveal,
  stillHidden,
  revealPending,
  onReveal,
}: {
  item: PlayerCharacteristicView
  visible: boolean
  inRevealMode: boolean
  canClickReveal: boolean
  stillHidden: boolean
  revealPending: boolean
  onReveal?: (id: string) => void
}) {
  const rarity = normalizeTraitRarity(item.characteristic.rarity)
  const RarityIcon = RARITY_ICON[rarity]
  const CategoryIcon = categoryIcon(item.category)
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

  const title = visible ? item.characteristic.title : '████████'
  const description = visible ? item.characteristic.description : null

  return (
    <article
      className={cn(
        traitTileClass(rarity, {
          revealed: item.is_revealed,
          visible,
        }),
        'flex h-[8.25rem] flex-col',
        canClickReveal && 'trait-card-armed',
        justRevealed && 'bunker-trait-reveal',
      )}
      aria-label={`${RARITY_LABELS[rarity]} · ${categoryLabel(item.category)} · ${title}`}
    >
      <span className="trait-card-bevel" aria-hidden />
      <span className="trait-card-corners" aria-hidden />

      {/* Rarity band — owns the top of the card */}
      <header className="trait-card-band relative z-[1] flex h-7 shrink-0 items-center justify-between gap-2 px-2.5">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]">
          <CategoryIcon className="size-3.5 opacity-90" aria-hidden />
          <span className="truncate">{categoryLabel(item.category)}</span>
        </span>
        <span className="inline-flex items-center gap-1">
          {stillHidden ? <Lock className="size-3 opacity-70" aria-hidden /> : null}
          <Tooltip>
            <TooltipTrigger
              type="button"
              className="inline-flex size-6 items-center justify-center rounded-sm opacity-90 outline-none hover:opacity-100 focus-visible:ring-2 focus-visible:ring-amber-500/50"
              aria-label={RARITY_LABELS[rarity]}
            >
              <RarityIcon className="size-3.5" aria-hidden />
            </TooltipTrigger>
            <TooltipContent side="top">
              <span className="bunker-hint-kicker">Редкость</span>
              {RARITY_LABELS[rarity]}
            </TooltipContent>
          </Tooltip>
        </span>
      </header>

      {/* Face */}
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col justify-between gap-1.5 px-2.5 py-2">
        <div className="min-h-0">
          <p
            className={cn(
              'line-clamp-2 font-[family-name:var(--font-display)] text-[13px] leading-snug tracking-wide',
              visible ? 'text-stone-50' : 'font-mono text-stone-600',
            )}
          >
            {title}
          </p>
          {description ? (
            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-stone-400/95">
              {description}
            </p>
          ) : null}
        </div>

        <div className="flex h-7 items-end justify-end">
          {inRevealMode ? (
            <Button
              type="button"
              size="icon-sm"
              variant={item.is_revealed ? 'secondary' : 'default'}
              className="size-7 shrink-0"
              disabled={!canClickReveal || revealPending}
              onClick={() => {
                setJustRevealed(true)
                onReveal?.(item.id)
              }}
              aria-label={item.is_revealed ? 'Уже раскрыто' : 'Раскрыть'}
            >
              {item.is_revealed ? <Check /> : <Eye />}
            </Button>
          ) : (
            <span className="size-7 shrink-0" aria-hidden />
          )}
        </div>
      </div>
    </article>
  )
}

export function PlayerCard({
  player,
  characteristics,
  isSelf = false,
  showHiddenAsOwner = false,
  compact = false,
  columns = 1,
  spotlight = false,
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
        spotlight &&
          !isSelf &&
          'border-amber-400/55 bg-gradient-to-br from-amber-950/35 via-stone-950/70 to-stone-950/85 ring-1 ring-amber-400/20',
      )}
    >
      <span className="bunker-rivet left-2.5 top-2.5" aria-hidden />
      <span className="bunker-rivet right-2.5 top-2.5" aria-hidden />
      <span className="bunker-rivet bottom-2.5 left-2.5" aria-hidden />
      <span className="bunker-rivet bottom-2.5 right-2.5" aria-hidden />
      <BunkerWatermark text={isEliminated ? 'исключён' : spotlight ? 'говорит' : 'досье'} />

      <div
        className={cn(
          'relative z-[1] flex items-center justify-between gap-2 border-b border-stone-800/70',
          compact ? 'px-4 py-2.5' : 'px-4 py-3 sm:px-5',
        )}
      >
        <h3 className="min-w-0 truncate font-[family-name:var(--font-display)] text-lg tracking-wide text-stone-50 sm:text-xl">
          {player.name}
        </h3>
        <div className="flex shrink-0 items-center gap-1">
          {spotlight ? (
            <Badge variant="default" className="text-[10px]">
              Ход
            </Badge>
          ) : null}
          {player.role === 'host' ? (
            <Badge variant="secondary" className="text-[10px]">
              Вед.
            </Badge>
          ) : null}
          {isSelf ? (
            <Badge variant="outline" className="text-[10px]">
              Вы
            </Badge>
          ) : null}
          {isEliminated ? <Badge variant="destructive">×</Badge> : null}
        </div>
      </div>

      <div className={cn('relative z-[1] px-3 pb-3 sm:px-4', compact ? 'pt-2.5' : 'pt-3')}>
        {characteristics.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {spotlight ? 'Пока ничего не раскрыто' : 'Характеристики ещё не выданы'}
          </p>
        ) : (
          <div
            className={cn(
              'grid gap-2.5',
              columns === 2 ? 'sm:grid-cols-2' : 'grid-cols-1',
            )}
          >
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
