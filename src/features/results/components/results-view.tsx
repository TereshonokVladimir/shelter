'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { PlayerCard } from '@/components/player-card/player-card'
import { NotebookProfile } from '@/features/game/components/notebook-profile'
import { PhaseShell } from '@/features/room/components/phase-shell'
import {
  CriteriaRadar,
  CyberRadialGauge,
} from '@/features/results/components/finale-charts'
import { CHARACTERISTIC_CATEGORIES } from '@/lib/constants'
import type {
  FinishCriterion,
  FinishStats,
  Player,
  PlayerCharacteristicView,
  Room,
} from '@/lib/api/types'

interface ResultsViewProps {
  room: Room
  players: Player[]
  characteristics: PlayerCharacteristicView[]
  finishStats?: FinishStats | null
}

type ResultsTab = 'verdict' | 'criteria' | 'roster'

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

function DeltaBadge({ value }: { value: number }) {
  return (
    <span
      className={cn(
        'inline-flex min-w-8 justify-center rounded border px-1.5 py-0.5 font-mono text-[11px] tabular-nums',
        value > 0 && 'border-emerald-700/50 text-emerald-300',
        value < 0 && 'border-rose-800/50 text-rose-300',
        value === 0 && 'border-stone-700/50 text-stone-500',
      )}
    >
      {value > 0 ? `+${value}` : value}
    </span>
  )
}

/** Ornamental clearance plaque for survivors — framed, not a paper slip. */
function SurvivorFrame({
  player,
  characteristics,
  index,
}: {
  player: Player
  characteristics: PlayerCharacteristicView[]
  index: number
}) {
  return (
    <article
      className="survivor-frame finale-stat-card"
      style={{ animationDelay: `${index * 90}ms` }}
      aria-label={`Пропуск: ${player.name}`}
    >
      <div className="survivor-frame-edge" aria-hidden />
      <span className="survivor-frame-corner survivor-frame-corner-tl" aria-hidden />
      <span className="survivor-frame-corner survivor-frame-corner-tr" aria-hidden />
      <span className="survivor-frame-corner survivor-frame-corner-bl" aria-hidden />
      <span className="survivor-frame-corner survivor-frame-corner-br" aria-hidden />

      <div className="survivor-frame-inner">
        <header className="survivor-frame-head">
          <p className="survivor-frame-seal">Пропуск · бункер</p>
          <h3 className="survivor-frame-name">{player.name}</h3>
          <p className="survivor-frame-meta">
            {player.role === 'host' ? 'Ведущий · допущен' : 'Выживший · допущен'}
          </p>
        </header>

        <div className="survivor-frame-body">
          {characteristics.length === 0 ? (
            <p className="text-sm text-stone-400">Характеристики не раскрыты.</p>
          ) : (
            <NotebookProfile
              player={player}
              characteristics={characteristics}
              showHiddenAsOwner
              compact
            />
          )}
        </div>
      </div>
    </article>
  )
}

function ChallengeHero({
  outlook,
  threshold,
  passed,
  disasterTitle,
}: {
  outlook: number
  threshold: number
  passed: boolean
  disasterTitle?: string | null
}) {
  return (
    <section
      className={cn(
        'finale-verdict-glow relative overflow-hidden border p-4 sm:p-5',
        passed
          ? 'border-cyan-500/30 bg-gradient-to-br from-stone-950 via-emerald-950/20 to-stone-950'
          : 'border-rose-500/35 bg-gradient-to-br from-stone-950 via-rose-950/25 to-stone-950',
      )}
      style={{
        ['--finale-glow' as string]: passed ? '#22d3ee' : '#fb7185',
        clipPath:
          'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))',
      }}
    >
      <div className="pointer-events-none absolute inset-0 bunker-scan opacity-50" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent"
        aria-hidden
      />

      <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,19rem)] lg:items-center">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300/75">
            // disaster.protocol
          </p>
          {disasterTitle ? (
            <h3
              className="text-glitch mt-2 font-[family-name:var(--font-display)] text-2xl tracking-wide text-stone-50 sm:text-3xl"
              data-text={disasterTitle}
            >
              {disasterTitle}
            </h3>
          ) : (
            <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl tracking-wide text-stone-50">
              Катастрофа
            </h3>
          )}
          <p className="mt-3 max-w-md text-sm leading-relaxed text-stone-400">
            {passed
              ? 'Состав закрыл порог катастрофы.'
              : 'Состава не хватило до порога катастрофы.'}
          </p>
        </div>

        <CyberRadialGauge outlook={outlook} threshold={threshold} passed={passed} />
      </div>
    </section>
  )
}

function CriteriaBoard({
  criteria,
  threshold,
  onOpen,
}: {
  criteria: FinishCriterion[]
  threshold: number
  onOpen: (id: string) => void
}) {
  const ranked = [...criteria].sort((a, b) => b.score - a.score)

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-amber-400/85">
          Критерии выживания
        </h3>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-500">
          зелёный ≥ порог {threshold}% · база 50% только для Δ
        </p>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {ranked.map((c, index) => {
          const clears = c.score >= threshold
          const vs = c.score - threshold
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onOpen(c.id)}
                className="finale-chip flex w-full flex-col rounded-lg border border-stone-800/80 bg-stone-950/55 p-3 text-left transition hover:border-cyan-500/40 hover:bg-stone-900/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-stone-100">{c.label}</p>
                  <p
                    className={cn(
                      'shrink-0 font-mono text-lg tabular-nums',
                      clears ? 'text-emerald-300' : 'text-rose-300',
                    )}
                  >
                    {c.score}%
                  </p>
                </div>
                <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-stone-900">
                  <div
                    className={cn(
                      'absolute inset-y-0 left-0 rounded-full',
                      clears
                        ? 'bg-gradient-to-r from-emerald-800 to-emerald-400'
                        : 'bg-gradient-to-r from-rose-900 to-rose-500',
                    )}
                    style={{ width: `${c.score}%` }}
                  />
                  <div
                    className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-amber-300"
                    style={{ left: `${threshold}%` }}
                    aria-hidden
                  />
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function CriteriaExplorer({
  criteria,
  threshold,
  focusId,
  onFocus,
}: {
  criteria: FinishCriterion[]
  threshold: number
  focusId: string | null
  onFocus: (id: string) => void
}) {
  const active =
    criteria.find((c) => c.id === focusId) ??
    [...criteria].sort((a, b) => a.score - b.score)[0] ??
    null

  return (
    <section className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col items-center gap-2 rounded-xl border border-stone-800/80 bg-stone-950/55 p-3">
          <CriteriaRadar
            criteria={criteria}
            threshold={threshold}
            activeId={active?.id}
            onSelect={onFocus}
          />
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-500">
            пунктир — порог катастрофы {threshold}% · тонкое кольцо — база 50%
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-stone-800/80 bg-stone-950/55">
          <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-stone-800/80 font-mono text-[10px] uppercase tracking-[0.14em] text-stone-500">
                <th className="px-3 py-2.5 font-medium">Критерий</th>
                <th className="px-3 py-2.5 font-medium">%</th>
                <th className="px-3 py-2.5 font-medium">Δ</th>
                <th className="hidden px-3 py-2.5 font-medium sm:table-cell">vs порог</th>
                <th className="px-3 py-2.5 font-medium">Шкала</th>
              </tr>
            </thead>
            <tbody>
              {criteria.map((c) => {
                const selected = active?.id === c.id
                const vs = c.score - threshold
                return (
                  <tr
                    key={c.id}
                    className={cn(
                      'cursor-pointer border-b border-stone-800/50 transition',
                      selected
                        ? 'bg-cyan-950/35'
                        : 'hover:bg-stone-900/60',
                    )}
                    onClick={() => onFocus(c.id)}
                  >
                    <td className="px-3 py-2.5 font-medium text-stone-100">{c.label}</td>
                    <td
                      className={cn(
                        'px-3 py-2.5 font-mono tabular-nums',
                        c.score >= threshold ? 'text-emerald-300' : 'text-rose-300',
                      )}
                    >
                      {c.score}
                    </td>
                    <td className="px-3 py-2.5">
                      <DeltaBadge value={c.delta} />
                    </td>
                    <td
                      className={cn(
                        'hidden px-3 py-2.5 font-mono text-[12px] tabular-nums sm:table-cell',
                        vs >= 0 ? 'text-emerald-400/90' : 'text-rose-400/90',
                      )}
                    >
                      {vs >= 0 ? `+${vs}` : vs}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="relative h-2 w-full min-w-[6rem] overflow-hidden rounded-full bg-stone-900">
                        <div
                          className={cn(
                            'absolute inset-y-0 left-0 rounded-full',
                            c.score >= threshold
                              ? 'bg-gradient-to-r from-emerald-800 to-emerald-400'
                              : 'bg-gradient-to-r from-rose-900 to-rose-500',
                          )}
                          style={{ width: `${c.score}%` }}
                        />
                        <div
                          className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-amber-300"
                          style={{ left: `${threshold}%` }}
                          aria-hidden
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {active ? (
        <article className="overflow-hidden rounded-xl border border-stone-800/80 bg-stone-950/55">
          <div className="flex items-start justify-between gap-3 border-b border-stone-800/80 px-4 py-3">
            <div>
              <h4 className="font-[family-name:var(--font-display)] text-lg tracking-wide text-stone-50">
                {active.label}
              </h4>
              <p className="mt-0.5 text-[12px] text-stone-500">{active.verdict}</p>
            </div>
            <p
              className={cn(
                'font-mono text-2xl tabular-nums',
                active.score >= threshold ? 'text-emerald-300' : 'text-rose-300',
              )}
            >
              {active.score}%
            </p>
          </div>
          <ul className="divide-y divide-stone-800/60">
            {active.drivers.length === 0 ? (
              <li className="px-4 py-3 text-sm text-stone-500">
                Нет явных вкладов — около базы; смотрите vs порог {threshold}%.
              </li>
            ) : (
              active.drivers.map((d) => (
                <li
                  key={`${d.player_id}-${d.trait_title}`}
                  className="flex items-start justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-stone-100">{d.name}</p>
                    <p className="mt-0.5 text-[13px] text-stone-400">{d.trait_title}</p>
                  </div>
                  <DeltaBadge value={d.delta} />
                </li>
              ))
            )}
          </ul>
        </article>
      ) : null}
    </section>
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

  const criteria = finishStats?.criteria ?? []
  const outlook = finishStats?.bunker_outlook
  const threshold = finishStats?.challenge_threshold ?? 50
  const passed = finishStats?.passed ?? (outlook != null ? outlook >= threshold : false)

  const [tab, setTab] = useState<ResultsTab>('verdict')
  const [focusId, setFocusId] = useState<string | null>(null)

  useEffect(() => {
    if (criteria.length === 0) return
    if (focusId && criteria.some((c) => c.id === focusId)) return
    const weakest = [...criteria].sort((a, b) => a.score - b.score)[0]
    setFocusId(weakest?.id ?? null)
  }, [criteria, focusId])

  function openCriterion(id: string) {
    setFocusId(id)
    setTab('criteria')
  }

  return (
    <PhaseShell
      wide
      title="Финал убежища"
      subtitle={`Раундов: ${finishStats?.max_round ?? room.current_round}`}
      step={passed ? 'Порог пройден.' : 'Порог не пройден.'}
      footer={
        <Link href="/create" className={cn(buttonVariants(), 'inline-flex w-fit')}>
          Создать новую комнату
        </Link>
      }
    >
      <Tabs
        value={tab}
        onValueChange={(value) => {
          if (value === 'verdict' || value === 'criteria' || value === 'roster') {
            setTab(value)
          }
        }}
        className="flex min-h-0 flex-col gap-3"
      >
        <TabsList variant="line" className="w-full max-w-lg">
          <TabsTrigger value="verdict" className="flex-1">
            Вердикт
          </TabsTrigger>
          <TabsTrigger value="criteria" className="flex-1" disabled={criteria.length === 0}>
            Критерии
          </TabsTrigger>
          <TabsTrigger value="roster" className="flex-1">
            Досье
          </TabsTrigger>
        </TabsList>

        <TabsContent value="verdict" className="flex flex-col gap-4 outline-none">
          {outlook != null ? (
            <ChallengeHero
              outlook={outlook}
              threshold={threshold}
              passed={passed}
              disasterTitle={finishStats?.disaster_title}
            />
          ) : null}
          {criteria.length > 0 ? (
            <CriteriaBoard
              criteria={criteria}
              threshold={threshold}
              onOpen={openCriterion}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="criteria" className="outline-none">
          {criteria.length > 0 ? (
            <CriteriaExplorer
              criteria={criteria}
              threshold={threshold}
              focusId={focusId}
              onFocus={setFocusId}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="roster" className="flex flex-col gap-4 outline-none">
          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-amber-300/85">
              Пропуск в бункер · {survivors.length}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {survivors.map((player, index) => (
                <SurvivorFrame
                  key={player.id}
                  player={player}
                  characteristics={sortedTraits(player.id, characteristics)}
                  index={index}
                />
              ))}
            </div>
          </section>

          {eliminated.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-rose-300/80">
                Изгнаны · {eliminated.length}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {eliminated.map((player, index) => (
                  <div
                    key={player.id}
                    className="finale-stat-card min-w-0"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <PlayerCard
                      player={player}
                      characteristics={sortedTraits(player.id, characteristics)}
                      showHiddenAsOwner
                      columns={2}
                    />
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </TabsContent>
      </Tabs>
    </PhaseShell>
  )
}
