'use client'

import { useEffect, useRef, useState } from 'react'
import { Lock } from 'lucide-react'
import { categoryLabel } from '@/features/character/utils/category-style'
import { CHARACTERISTIC_CATEGORIES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Player, PlayerCharacteristicView } from '@/lib/api/types'

interface NotebookProfileProps {
  player: Player
  characteristics: PlayerCharacteristicView[]
  showHiddenAsOwner?: boolean
  revealedOnly?: boolean
  onReveal?: (characteristicId: string) => void
  revealPending?: boolean
  canReveal?: boolean
  /** Compact header for sheets / compare columns */
  compact?: boolean
  className?: string
}

function sortedChars(characteristics: PlayerCharacteristicView[]) {
  return [...characteristics].sort(
    (a, b) =>
      CHARACTERISTIC_CATEGORIES.indexOf(a.category) -
      CHARACTERISTIC_CATEGORIES.indexOf(b.category),
  )
}

function NotebookEntry({
  item,
  visible,
  canClickReveal,
  stillHidden,
  revealPending,
  onReveal,
}: {
  item: PlayerCharacteristicView
  visible: boolean
  canClickReveal: boolean
  stillHidden: boolean
  revealPending: boolean
  onReveal?: (id: string) => void
}) {
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

  const title = visible ? item.characteristic.title : '············'
  const description = visible ? item.characteristic.description : null

  return (
    <li
      className={cn(
        'dossier-entry flex items-start justify-between gap-2',
        !visible && 'dossier-entry-hidden',
        justRevealed && 'bunker-trait-reveal',
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="dossier-entry-cat inline-flex items-center gap-1.5">
          {stillHidden ? <Lock className="size-3 opacity-70" aria-hidden /> : null}
          {categoryLabel(item.category)}
          {item.is_revealed ? (
            <span className="text-[10px] tracking-[0.12em] text-emerald-800/75">· открыто</span>
          ) : null}
        </p>
        <p className="dossier-hand dossier-entry-title">{title}</p>
        {description ? (
          <p className="dossier-hand dossier-entry-body">{description}</p>
        ) : !visible ? (
          <p className="dossier-hand dossier-entry-body">скрыто до раскрытия</p>
        ) : null}
      </div>

      {canClickReveal ? (
        <button
          type="button"
          className="dossier-reveal-btn shrink-0"
          disabled={revealPending}
          onClick={() => onReveal?.(item.id)}
        >
          {revealPending ? '…' : 'открыть →'}
        </button>
      ) : item.is_revealed ? (
        <span className="dossier-opened-mark shrink-0" aria-label="открыто">
          ✓
        </span>
      ) : null}
    </li>
  )
}

/** Lined-notebook page of the player's traits (handwritten look). */
export function NotebookProfile({
  player,
  characteristics,
  showHiddenAsOwner = false,
  revealedOnly = false,
  onReveal,
  revealPending = false,
  canReveal = false,
  compact = false,
  className,
}: NotebookProfileProps) {
  const items = sortedChars(
    revealedOnly
      ? characteristics.filter((c) => c.is_revealed)
      : characteristics,
  )
  const isSelf = showHiddenAsOwner

  return (
    <section className={className}>
      <header
        className={cn(
          'border-b border-dashed border-stone-600/25',
          compact ? 'mb-2 pb-1.5' : 'mb-3 pb-2',
        )}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-600">
          {compact ? 'Досье' : 'Запись в блокноте'}
        </p>
        <h3
          className={cn(
            'dossier-hand mt-0.5 font-semibold text-[var(--nb-ink)]',
            compact ? 'text-2xl' : 'text-3xl sm:text-4xl',
          )}
        >
          {player.name}
        </h3>
        {!compact ? (
          <p className="mt-1 text-xs leading-relaxed text-stone-600">
            {isSelf
              ? 'Ваши характеристики. Записи видны только вам, пока не откроете.'
              : 'Только раскрытые факты.'}
          </p>
        ) : null}
      </header>

      {items.length === 0 ? (
        <p className="dossier-hand text-xl text-stone-500">
          {revealedOnly ? 'Пока ничего не раскрыто…' : 'Страница пока пуста…'}
        </p>
      ) : (
        <ul
          className={cn(
            'dossier-traits',
            compact && 'dossier-traits--compact',
          )}
        >
          {items.map((item) => {
            const visible = item.is_revealed || (isSelf && showHiddenAsOwner)
            const inRevealMode = Boolean(onReveal) && isSelf
            const canClickReveal = inRevealMode && canReveal && !item.is_revealed
            const stillHidden = !item.is_revealed && isSelf && showHiddenAsOwner

            return (
              <NotebookEntry
                key={item.id}
                item={item}
                visible={visible}
                canClickReveal={canClickReveal}
                stillHidden={stillHidden}
                revealPending={revealPending}
                onReveal={onReveal}
              />
            )
          })}
        </ul>
      )}
    </section>
  )
}
