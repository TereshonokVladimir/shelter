import {
  Briefcase,
  Dna,
  HeartPulse,
  Palette,
  Ghost,
  Backpack,
  Smile,
  ScrollText,
  type LucideIcon,
} from 'lucide-react'
import { CATEGORY_LABELS } from '@/lib/constants'
import type { CharacteristicCategory } from '@/types/common'
import { cn } from '@/lib/utils'

export function categoryLabel(category: string) {
  return CATEGORY_LABELS[category as CharacteristicCategory] ?? category
}

export const CATEGORY_ICON: Record<CharacteristicCategory, LucideIcon> = {
  profession: Briefcase,
  biology: Dna,
  health: HeartPulse,
  hobby: Palette,
  phobia: Ghost,
  baggage: Backpack,
  personality: Smile,
  fact: ScrollText,
}

export function categoryIcon(category: string): LucideIcon {
  return CATEGORY_ICON[category as CharacteristicCategory] ?? ScrollText
}

/** @deprecated Prefer icon + tooltip; kept for admin/compat. */
export function CategoryChip({
  category,
  className,
}: {
  category: string
  className?: string
  revealed?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border border-stone-600/45 bg-stone-950/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400',
        className,
      )}
    >
      {categoryLabel(category)}
    </span>
  )
}
