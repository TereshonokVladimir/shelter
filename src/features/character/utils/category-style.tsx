import { CATEGORY_LABELS } from '@/lib/constants'
import type { CharacteristicCategory } from '@/types/common'
import { cn } from '@/lib/utils'

export function categoryLabel(category: string) {
  return CATEGORY_LABELS[category as CharacteristicCategory] ?? category
}

/** Neutral chip — category is label only; rarity carries the visual weight. */
export function CategoryChip({
  category,
  className,
}: {
  category: string
  className?: string
  /** @deprecated kept for call-site compat; ignored */
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
