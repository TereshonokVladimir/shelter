import { Circle, Diamond, Hexagon, Pentagon, Sparkles, Star, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TraitRarity } from '@/lib/api/types'

export const RARITY_LABELS: Record<TraitRarity, string> = {
  common: 'Обычная',
  uncommon: 'Необычная',
  rare: 'Редкая',
  epic: 'Эпическая',
  legendary: 'Легендарная',
  mythic: 'Мифическая',
}

export const RARITY_ICON: Record<TraitRarity, LucideIcon> = {
  common: Circle,
  uncommon: Diamond,
  rare: Star,
  epic: Pentagon,
  legendary: Sparkles,
  mythic: Hexagon,
}

export function normalizeTraitRarity(value: string | null | undefined): TraitRarity {
  if (value === 'unique') return 'mythic'
  if (
    value === 'uncommon' ||
    value === 'rare' ||
    value === 'epic' ||
    value === 'legendary' ||
    value === 'mythic'
  ) {
    return value
  }
  return 'common'
}

/** @deprecated Prefer full-frame trait cards; kept for compact lists. */
export function RarityBadge({
  rarity,
  className,
  compact,
}: {
  rarity: TraitRarity | string | undefined
  className?: string
  compact?: boolean
}) {
  const key = normalizeTraitRarity(rarity)
  const Icon = RARITY_ICON[key]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]',
        key === 'common' && 'border-stone-600/55 bg-stone-900/70 text-stone-400',
        key === 'uncommon' && 'border-zinc-400/45 bg-zinc-800/55 text-zinc-200',
        key === 'rare' && 'border-sky-500/50 bg-sky-950/55 text-sky-200',
        key === 'epic' && 'border-orange-500/50 bg-orange-950/50 text-orange-200',
        key === 'legendary' && 'border-amber-400/55 bg-amber-950/55 text-amber-100',
        key === 'mythic' && 'border-red-400/55 bg-red-950/50 text-red-100',
        className,
      )}
      title={RARITY_LABELS[key]}
    >
      <Icon className="size-3 opacity-90" />
      {compact ? null : RARITY_LABELS[key]}
    </span>
  )
}

/** Full TCG-style card surface: rarity owns frame, band, and finish. */
export function traitTileClass(
  rarity: TraitRarity | string | undefined,
  options: { revealed: boolean; visible: boolean },
) {
  const key = normalizeTraitRarity(rarity)
  return cn(
    'trait-card',
    `trait-rarity-${key}`,
    options.revealed ? 'trait-state-open' : 'trait-state-sealed',
    options.visible && 'trait-known',
  )
}
