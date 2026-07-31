'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { NotebookProfile } from '@/features/game/components/notebook-profile'
import { CHARACTERISTIC_CATEGORIES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Player, PlayerCharacteristicView } from '@/lib/api/types'

const MAX_COMPARE = 3

type ViewMode = 'browse' | 'compare'

interface PlayersCompareProps {
  players: Player[]
  characteristics: PlayerCharacteristicView[]
  revealedOnly?: boolean
  emptyLabel?: string
  focusPlayerId?: string | null
  lockedMode?: ViewMode
  /** When false (hidden tab), skip track positioning that fights page scroll */
  active?: boolean
}

function traitsFor(
  playerId: string,
  characteristics: PlayerCharacteristicView[],
  revealedOnly: boolean,
) {
  return characteristics
    .filter((c) => {
      if (c.player_id !== playerId) return false
      return revealedOnly ? c.is_revealed : true
    })
    .sort(
      (a, b) =>
        CHARACTERISTIC_CATEGORIES.indexOf(a.category) -
        CHARACTERISTIC_CATEGORIES.indexOf(b.category),
    )
}

function initialBrowseIndex(
  players: Player[],
  characteristics: PlayerCharacteristicView[],
  revealedOnly: boolean,
  focusPlayerId?: string | null,
) {
  if (focusPlayerId) {
    const focusIdx = players.findIndex((p) => p.id === focusPlayerId)
    if (focusIdx >= 0) return focusIdx
  }
  const withTraits = players.findIndex(
    (p) => traitsFor(p.id, characteristics, revealedOnly).length > 0,
  )
  return withTraits >= 0 ? withTraits : 0
}

function BrowseMode({
  players,
  characteristics,
  revealedOnly,
  emptyLabel,
  focusPlayerId,
  active = true,
}: {
  players: Player[]
  characteristics: PlayerCharacteristicView[]
  revealedOnly: boolean
  emptyLabel: string
  focusPlayerId?: string | null
  active?: boolean
}) {
  const [index, setIndex] = useState(() =>
    initialBrowseIndex(players, characteristics, revealedOnly, focusPlayerId),
  )
  const trackRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map())
  const skipScrollSync = useRef(false)
  const preferSmooth = useRef(false)

  /** Scroll only the carousel track — never ancestor page scroll. */
  function scrollCardInTrack(nextIndex: number, behavior: ScrollBehavior) {
    const track = trackRef.current
    const player = players[nextIndex]
    const node = player ? cardRefs.current.get(player.id) : null
    if (!track || !node) return
    const left = node.offsetLeft - (track.clientWidth - node.offsetWidth) / 2
    track.scrollTo({ left: Math.max(0, left), behavior })
  }

  function goTo(next: number) {
    const clamped = Math.max(0, Math.min(players.length - 1, next))
    skipScrollSync.current = false
    preferSmooth.current = true
    setIndex(clamped)
  }

  useEffect(() => {
    if (!focusPlayerId) return
    const focusIdx = players.findIndex((p) => p.id === focusPlayerId)
    if (focusIdx < 0) return
    skipScrollSync.current = false
    preferSmooth.current = false
    setIndex(focusIdx)
  }, [focusPlayerId, players])

  useEffect(() => {
    if (index > players.length - 1) setIndex(Math.max(0, players.length - 1))
  }, [index, players.length])

  useEffect(() => {
    if (!active) return
    if (skipScrollSync.current) {
      skipScrollSync.current = false
      return
    }
    const behavior = preferSmooth.current ? 'smooth' : 'auto'
    preferSmooth.current = false
    // rAF: panel may have just become visible after keepMounted unhide
    requestAnimationFrame(() => {
      scrollCardInTrack(index, behavior)
    })
  }, [active, index, players])

  const canPrev = index > 0
  const canNext = index < players.length - 1
  const current = players[index]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="dossier-carousel-nav shrink-0"
          disabled={!canPrev}
          aria-label="Предыдущий игрок"
          onClick={() => goTo(index - 1)}
        >
          <ChevronLeft className="size-5" />
        </button>

        <div
          className="scrollbar-thin flex min-w-0 flex-1 gap-1.5 overflow-x-auto py-0.5"
          role="tablist"
          aria-label="Игроки"
        >
          {players.map((player, i) => {
            const active = i === index
            const isFocus = player.id === focusPlayerId
            return (
              <button
                key={player.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={cn(
                  'dossier-carousel-chip shrink-0',
                  active && 'dossier-carousel-chip--active',
                  player.status === 'eliminated' && 'opacity-55',
                )}
                onClick={() => goTo(i)}
              >
                <span className="dossier-hand truncate text-lg font-semibold leading-none">
                  {player.name}
                </span>
                {isFocus ? (
                  <Badge variant="default" className="ml-1 text-[9px]">
                    Ход
                  </Badge>
                ) : null}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          className="dossier-carousel-nav shrink-0"
          disabled={!canNext}
          aria-label="Следующий игрок"
          onClick={() => goTo(index + 1)}
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div
        ref={trackRef}
        className="dossier-carousel-track scrollbar-thin flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1"
        onScroll={(event) => {
          const track = event.currentTarget
          const center = track.scrollLeft + track.clientWidth / 2
          let best = 0
          let bestDist = Number.POSITIVE_INFINITY
          players.forEach((player, i) => {
            const node = cardRefs.current.get(player.id)
            if (!node) return
            const mid = node.offsetLeft + node.offsetWidth / 2
            const dist = Math.abs(mid - center)
            if (dist < bestDist) {
              bestDist = dist
              best = i
            }
          })
          if (best !== index) {
            skipScrollSync.current = true
            setIndex(best)
          }
        }}
      >
        {players.map((player, i) => {
          const traits = traitsFor(player.id, characteristics, revealedOnly)
          const isFocus = player.id === focusPlayerId
          return (
            <article
              key={player.id}
              ref={(node) => {
                if (node) cardRefs.current.set(player.id, node)
                else cardRefs.current.delete(player.id)
              }}
              className={cn(
                'dossier-paper-player dossier-carousel-card snap-center',
                isFocus && 'data-focus',
                player.status === 'eliminated' && 'opacity-55',
              )}
              data-focus={isFocus ? '' : undefined}
              aria-hidden={i !== index}
            >
              {traits.length === 0 ? (
                <p className="dossier-hand px-1 py-6 text-center text-xl text-stone-500">
                  {emptyLabel}
                </p>
              ) : (
                <NotebookProfile
                  player={player}
                  characteristics={traits}
                  revealedOnly={revealedOnly}
                  compact
                />
              )}
            </article>
          )
        })}
      </div>

      {current ? (
        <p className="dossier-hand text-center text-base text-stone-500">
          {index + 1} / {players.length}
          {current.role === 'host' ? ' · ведущий' : ''}
        </p>
      ) : null}
    </div>
  )
}

function CompareMode({
  players,
  characteristics,
  revealedOnly,
  emptyLabel,
}: {
  players: Player[]
  characteristics: PlayerCharacteristicView[]
  revealedOnly: boolean
  emptyLabel: string
}) {
  const suggested = useMemo(
    () =>
      players
        .filter((p) => traitsFor(p.id, characteristics, revealedOnly).length > 0)
        .slice(0, 2)
        .map((p) => p.id),
    [players, characteristics, revealedOnly],
  )

  const [selectedIds, setSelectedIds] = useState<string[]>(suggested)

  function toggle(playerId: string) {
    setSelectedIds((current) => {
      if (current.includes(playerId)) return current.filter((id) => id !== playerId)
      if (current.length >= MAX_COMPARE) return current
      return [...current, playerId]
    })
  }

  const visible = selectedIds
    .map((id) => players.find((p) => p.id === id))
    .filter((p): p is Player => Boolean(p))

  const cols =
    visible.length <= 1
      ? 'grid-cols-1'
      : visible.length === 2
        ? 'md:grid-cols-2'
        : 'md:grid-cols-2 xl:grid-cols-3'

  return (
    <div className="flex flex-col gap-3">
      <p className="dossier-hand text-lg text-stone-600">
        Отметьте до {MAX_COMPARE} — листки встанут рядом.
      </p>
      <ul className="flex flex-wrap gap-2">
        {players.map((player) => {
          const checked = selectedIds.includes(player.id)
          const count = traitsFor(player.id, characteristics, revealedOnly).length
          const atLimit = !checked && selectedIds.length >= MAX_COMPARE

          return (
            <li key={player.id}>
              <label
                className={cn(
                  'dossier-paper-player flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm transition',
                  checked && 'data-focus',
                  atLimit && 'opacity-55',
                  player.status === 'eliminated' && 'opacity-50',
                )}
                data-focus={checked ? '' : undefined}
              >
                <input
                  type="checkbox"
                  className="size-3.5 accent-amber-700"
                  checked={checked}
                  disabled={atLimit}
                  onChange={() => toggle(player.id)}
                />
                <span className="dossier-hand max-w-[9rem] truncate text-lg font-semibold text-[var(--nb-ink)]">
                  {player.name}
                </span>
                <span className="tabular-nums text-[11px] text-stone-500">{count}</span>
              </label>
            </li>
          )
        })}
      </ul>

      {visible.length === 0 ? (
        <p className="text-sm text-stone-600">Выберите игроков выше.</p>
      ) : (
        <div className={cn('grid gap-3', cols)}>
          {visible.map((player) => {
            const traits = traitsFor(player.id, characteristics, revealedOnly)
            return (
              <div
                key={player.id}
                className={cn(
                  'dossier-paper-player p-3',
                  player.status === 'eliminated' && 'opacity-55',
                )}
              >
                {traits.length === 0 ? (
                  <p className="py-2 text-sm text-stone-600">{emptyLabel}</p>
                ) : (
                  <NotebookProfile
                    player={player}
                    characteristics={traits}
                    revealedOnly={revealedOnly}
                    compact
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function PlayersCompare({
  players,
  characteristics,
  revealedOnly = true,
  emptyLabel = 'Ещё ничего не раскрыто',
  focusPlayerId = null,
  lockedMode,
  active = true,
}: PlayersCompareProps) {
  if (players.length === 0) {
    return <p className="dossier-hand text-xl text-stone-500">Пока нет других игроков.</p>
  }

  const activeMode = lockedMode ?? 'browse'

  return (
    <div className="flex flex-col gap-3">
      {activeMode === 'browse' ? (
        <BrowseMode
          players={players}
          characteristics={characteristics}
          revealedOnly={revealedOnly}
          emptyLabel={emptyLabel}
          focusPlayerId={focusPlayerId}
          active={active}
        />
      ) : (
        <CompareMode
          players={players}
          characteristics={characteristics}
          revealedOnly={revealedOnly}
          emptyLabel={emptyLabel}
        />
      )}
    </div>
  )
}
