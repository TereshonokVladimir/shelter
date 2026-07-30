'use client'

import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { CategoryChip } from '@/features/character/utils/category-style'
import { RarityBadge, traitTileClass } from '@/features/character/utils/rarity-style'
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

function TraitList({
  traits,
  emptyLabel,
}: {
  traits: PlayerCharacteristicView[]
  emptyLabel: string
}) {
  if (traits.length === 0) {
    return <p className="px-1 py-2 text-sm text-muted-foreground">{emptyLabel}</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {traits.map((item) => (
        <li
          key={item.id}
          className={traitTileClass(item.characteristic.rarity, {
            revealed: item.is_revealed,
            visible: true,
          })}
        >
          <div className="relative z-[1] px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <RarityBadge rarity={item.characteristic.rarity} />
              <CategoryChip category={item.category} />
            </div>
            <p className="mt-1.5 text-sm font-medium text-stone-50">
              {item.characteristic.title}
            </p>
            {item.characteristic.description ? (
              <p className="mt-0.5 text-xs leading-relaxed text-stone-400">
                {item.characteristic.description}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Default: compact list — several rows can stay open (shadcn Collapsible). */
function BrowseMode({
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
  const [openIds, setOpenIds] = useState<Set<string>>(() => {
    const first = players.find(
      (p) => traitsFor(p.id, characteristics, revealedOnly).length > 0,
    )
    return new Set(first ? [first.id] : [])
  })

  return (
    <ul className="flex flex-col gap-2">
      {players.map((player) => {
        const traits = traitsFor(player.id, characteristics, revealedOnly)
        const isOpen = openIds.has(player.id)

        return (
          <li key={player.id}>
            <Collapsible
              open={isOpen}
              onOpenChange={(open) => {
                setOpenIds((prev) => {
                  const next = new Set(prev)
                  if (open) next.add(player.id)
                  else next.delete(player.id)
                  return next
                })
              }}
              className={cn(
                'overflow-hidden rounded-xl border border-border/55 bg-card/90',
                player.status === 'eliminated' && 'opacity-55',
              )}
            >
              <CollapsibleTrigger className="group flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-stone-900/40">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-stone-50">
                    {player.name}
                  </span>
                  <span className="block text-xs text-stone-500">
                    {traits.length > 0 ? `открыто: ${traits.length}` : emptyLabel}
                  </span>
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  {player.role === 'host' ? <Badge variant="secondary">Ведущий</Badge> : null}
                  <ChevronDown className="size-4 text-stone-400 transition-transform duration-200 group-data-panel-open:rotate-180" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent
                keepMounted
                className="flex h-[var(--collapsible-panel-height)] flex-col overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0 [&[hidden]:not([hidden='until-found'])]:hidden"
              >
                <div className="border-t border-border/40 px-3 py-3">
                  <TraitList traits={traits} emptyLabel={emptyLabel} />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </li>
        )
      })}
    </ul>
  )
}

/** Optional: pick 2–3 and put them side by side. */
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
    <div className="flex flex-col gap-4">
      <ul className="flex flex-wrap gap-2">
        {players.map((player) => {
          const checked = selectedIds.includes(player.id)
          const count = traitsFor(player.id, characteristics, revealedOnly).length
          const atLimit = !checked && selectedIds.length >= MAX_COMPARE

          return (
            <li key={player.id}>
              <label
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition',
                  checked
                    ? 'border-amber-600/50 bg-amber-950/40 text-amber-50'
                    : 'border-border/50 bg-card/60 text-stone-300 hover:border-stone-500/50',
                  atLimit && 'opacity-55',
                  player.status === 'eliminated' && 'opacity-50',
                )}
              >
                <input
                  type="checkbox"
                  className="size-3.5 accent-amber-500"
                  checked={checked}
                  disabled={atLimit}
                  onChange={() => toggle(player.id)}
                />
                <span className="max-w-[9rem] truncate font-medium">{player.name}</span>
                <span className="tabular-nums text-[11px] text-stone-500">{count}</span>
              </label>
            </li>
          )
        })}
      </ul>

      {visible.length === 0 ? (
        <p className="text-sm text-stone-500">
          Отметьте 2–{MAX_COMPARE} игроков, чтобы сравнить их рядом.
        </p>
      ) : (
        <div className={cn('grid gap-4', cols)}>
          {visible.map((player) => (
            <div
              key={player.id}
              className={cn(
                'overflow-hidden rounded-xl border border-border/55 bg-card/90',
                player.status === 'eliminated' && 'opacity-55',
              )}
            >
              <div className="flex items-center justify-between gap-2 border-b border-border/40 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-stone-50">{player.name}</p>
                  <p className="text-xs text-stone-500">
                    открыто:{' '}
                    {traitsFor(player.id, characteristics, revealedOnly).length}
                  </p>
                </div>
                {player.role === 'host' ? <Badge variant="secondary">Ведущий</Badge> : null}
              </div>
              <div className="p-3">
                <TraitList
                  traits={traitsFor(player.id, characteristics, revealedOnly)}
                  emptyLabel={emptyLabel}
                />
              </div>
            </div>
          ))}
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
}: PlayersCompareProps) {
  const [mode, setMode] = useState<ViewMode>('browse')

  if (players.length === 0) {
    return <p className="text-sm text-muted-foreground">Пока нет других игроков.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-border/50 bg-stone-950/40 p-1">
          <Button
            type="button"
            size="sm"
            variant={mode === 'browse' ? 'default' : 'ghost'}
            onClick={() => setMode('browse')}
          >
            Все игроки
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === 'compare' ? 'default' : 'ghost'}
            onClick={() => setMode('compare')}
          >
            Сравнить
          </Button>
        </div>
        <p className="text-xs text-stone-500">
          {mode === 'browse'
            ? 'Можно открыть несколько аккордеонов сразу.'
            : `Выберите до ${MAX_COMPARE} и смотрите рядом.`}
        </p>
      </div>

      {mode === 'browse' ? (
        <BrowseMode
          players={players}
          characteristics={characteristics}
          revealedOnly={revealedOnly}
          emptyLabel={emptyLabel}
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
