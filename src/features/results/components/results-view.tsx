'use client'

import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PlayerCard } from '@/components/player-card/player-card'
import { PhaseShell } from '@/features/room/components/phase-shell'
import { RarityBadge, RARITY_LABELS } from '@/features/character/utils/rarity-style'
import { CHARACTERISTIC_CATEGORIES } from '@/lib/constants'
import type {
  FinishStats,
  Player,
  PlayerCharacteristicView,
  Room,
  TraitRarity,
} from '@/lib/api/types'

interface ResultsViewProps {
  room: Room
  players: Player[]
  characteristics: PlayerCharacteristicView[]
  finishStats?: FinishStats | null
}

function sortedTraits(
  playerId: string,
  characteristics: PlayerCharacteristicView[],
) {
  return characteristics
    .filter((c) => c.player_id === playerId)
    .sort(
      (a, b) =>
        CHARACTERISTIC_CATEGORIES.indexOf(a.category) -
        CHARACTERISTIC_CATEGORIES.indexOf(b.category),
    )
}

function ChanceBar({ value, survived }: { value: number; survived: boolean }) {
  return (
    <div className="mt-2">
      <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-[0.14em]">
        <span className="text-stone-400">Индекс выживания</span>
        <span className={survived ? 'text-emerald-300' : 'text-rose-300'}>{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-stone-900/80">
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-700 ease-out',
            survived
              ? 'bg-gradient-to-r from-emerald-700 to-emerald-400'
              : 'bg-gradient-to-r from-rose-800 to-rose-500',
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

export function ResultsView({
  room,
  players,
  characteristics,
  finishStats,
}: ResultsViewProps) {
  const survivors = players.filter((p) => p.status === 'active')
  const eliminated = players
    .filter((p) => p.status === 'eliminated')
    .sort((a, b) => (a.eliminated_at ?? '').localeCompare(b.eliminated_at ?? ''))

  const ranking = finishStats?.players ?? []

  return (
    <PhaseShell
      title="Финал убежища"
      subtitle={`Мест: ${room.shelter_capacity ?? '—'} · раундов: ${finishStats?.max_round ?? room.current_round}. Все карты открыты.`}
      step="Индекс выживания — игровой итог по голосам, раундам и редкости карт (не «честная» математика, а атмосфера отчёта)."
      footer={
        <Link href="/create" className={cn(buttonVariants(), 'inline-flex w-fit')}>
          Создать новую комнату
        </Link>
      }
    >
      <div className="flex flex-col gap-8">
        {ranking.length > 0 ? (
          <section className="bunker-phase-enter flex flex-col gap-3">
            <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-amber-400/85">
              Итоговый отчёт
            </h3>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {ranking.map((row, index) => (
                <li
                  key={row.player_id}
                  className={cn(
                    'finale-stat-card relative overflow-hidden rounded-xl border px-4 py-3',
                    row.survived
                      ? 'border-emerald-700/45 bg-emerald-950/30'
                      : 'border-rose-900/40 bg-stone-950/55',
                  )}
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-[family-name:var(--font-display)] text-lg tracking-wide text-stone-50">
                        {row.name}
                      </p>
                      <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-stone-500">
                        {row.survived ? 'В убежище' : 'Исключён'} · раундов {row.rounds_lasted} ·
                        голосов против {row.votes_against}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'rounded-md border px-2 py-1 font-mono text-sm tabular-nums',
                        row.survived
                          ? 'border-emerald-600/40 text-emerald-200'
                          : 'border-rose-700/40 text-rose-200',
                      )}
                    >
                      {row.survival_chance}%
                    </span>
                  </div>
                  <ChanceBar value={row.survival_chance} survived={row.survived} />
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {(Object.keys(RARITY_LABELS) as TraitRarity[])
                      .filter((rarity) => (row.rarity_counts?.[rarity] ?? 0) > 0)
                      .map((rarity) => (
                        <span key={rarity} className="inline-flex items-center gap-1">
                          <RarityBadge rarity={rarity} />
                          <span className="text-[10px] text-stone-500">
                            ×{row.rarity_counts[rarity]}
                          </span>
                        </span>
                      ))}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-400/80">
            Выжившие · {survivors.length}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {survivors.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                characteristics={sortedTraits(player.id, characteristics)}
                showHiddenAsOwner
                columns={2}
              />
            ))}
          </div>
        </section>

        {eliminated.length > 0 ? (
          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-rose-300/80">
              Исключённые · {eliminated.length}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {eliminated.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  characteristics={sortedTraits(player.id, characteristics)}
                  showHiddenAsOwner
                  columns={2}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </PhaseShell>
  )
}
