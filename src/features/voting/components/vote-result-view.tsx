'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { GameTimer } from '@/components/game-timer/game-timer'
import { NotebookProfile } from '@/features/game/components/notebook-profile'
import { PhaseShell } from '@/features/room/components/phase-shell'
import {
  beginPresentationRequest,
  nextRevealRoundRequest,
  finishGameRequest,
} from '@/features/room/actions/api-commands'
import { cn } from '@/lib/utils'
import type { Player, PlayerCharacteristicView, Room } from '@/lib/api/types'

interface VoteResultViewProps {
  room: Room
  players: Player[]
  me: Player
  characteristics: PlayerCharacteristicView[]
  onChanged?: () => void
}

export function VoteResultView({
  room,
  players,
  me,
  characteristics,
  onChanged,
}: VoteResultViewProps) {
  const [pending, startTransition] = useTransition()
  const isHost = me.role === 'host'
  const isPaused = Boolean(room.is_paused)
  const summary = room.last_vote_summary as {
    tie?: boolean
    eliminated_player_id?: string | null
    eliminated_player_ids?: string[]
    seats_needed?: number
    tallies?: Array<{ player_id: string; votes: number }>
    candidate_ids?: string[]
  }

  const isTie = Boolean(summary?.tie)
  const eliminatedIds =
    summary?.eliminated_player_ids?.length
      ? summary.eliminated_player_ids
      : summary?.eliminated_player_id
        ? [summary.eliminated_player_id]
        : []
  const eliminated = eliminatedIds
    .map((id) => players.find((p) => p.id === id))
    .filter((p): p is Player => Boolean(p))
  const eliminatedSet = new Set(eliminatedIds)
  const seatsNeeded = summary?.seats_needed ?? room.eliminations_this_round ?? 1
  const tallies = [...(summary?.tallies ?? [])].sort((a, b) => b.votes - a.votes)
  const maxVotes = tallies[0]?.votes ?? 0

  function nextRound() {
    startTransition(async () => {
      const result = await nextRevealRoundRequest(room.id)
      if (!result.ok) toast.error(result.error ?? 'Не удалось начать раунд')
      else onChanged?.()
    })
  }

  function startRevoteSpeeches() {
    startTransition(async () => {
      const result = await beginPresentationRequest(room.id)
      if (!result.ok) toast.error(result.error ?? 'Не удалось начать речи')
      else onChanged?.()
    })
  }

  function finish() {
    startTransition(async () => {
      const result = await finishGameRequest(room.id)
      if (!result.ok) toast.error(result.error ?? 'Не удалось завершить игру')
      else onChanged?.()
    })
  }

  return (
    <PhaseShell
      wide
      title="Результат голосования"
      subtitle={`Раунд ${room.current_round}`}
      step={
        isTie
          ? seatsNeeded > 1
            ? `Ничья за ${seatsNeeded} мест — речи, затем переголосование.`
            : 'Ничья — речи кандидатов, затем переголосование.'
          : 'Дальше новый раунд (авто или вручную).'
      }
      badge={
        <GameTimer
          phaseEndsAt={room.phase_ends_at}
          label="Автопереход"
          subject={isTie ? 'К речам перед переголосованием' : 'К следующему раунду'}
          paused={isPaused}
          expiredHint="Фаза переключится автоматически."
        />
      }
      footer={
        isHost ? (
          <div className="flex flex-wrap justify-end gap-2">
            {isTie ? (
              <Button
                type="button"
                size="lg"
                disabled={pending || isPaused}
                onClick={startRevoteSpeeches}
              >
                Речи перед переголосованием
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                disabled={pending || isPaused}
                onClick={nextRound}
              >
                Следующий раунд
              </Button>
            )}
            <Button type="button" variant="outline" disabled={pending} onClick={finish}>
              Завершить игру
            </Button>
          </div>
        ) : (
          <p className="text-sm text-stone-400">Ожидайте автоперехода или решения ведущего.</p>
        )
      }
    >
      <div className="flex w-full flex-col gap-6">
        {isTie ? (
          <div className="rounded-lg border border-amber-700/45 bg-amber-950/35 p-3">
            <p className="font-medium text-amber-100">Ничья</p>
            <p className="mt-1 text-sm text-stone-300">
              Нужно исключить ещё {seatsNeeded}. Кандидаты выступят перед переголосованием.
            </p>
          </div>
        ) : null}

        {eliminated.length > 0 ? (
          <div className="flex flex-col gap-4">
            {eliminated.map((player) => (
              <article
                key={player.id}
                className="exile-sheet dossier-paper-sheet"
                aria-label={`Изгнан: ${player.name}`}
              >
                <div className="exile-sheet-body">
                  <NotebookProfile
                    player={player}
                    characteristics={characteristics.filter((c) => c.player_id === player.id)}
                    showHiddenAsOwner
                  />
                </div>
                <div className="exile-stamp" aria-hidden>
                  <span className="exile-stamp-mark">Изгнан</span>
                </div>
              </article>
            ))}
          </div>
        ) : !isTie ? (
          <p className="dossier-hand text-lg text-stone-400">Никого не исключили.</p>
        ) : null}

        <aside className="flex w-full flex-col gap-2">
          <p className="vote-scraps-label">Голоса · обрывки</p>
          {tallies.length === 0 ? (
            <p className="text-sm text-stone-500">Пока нет подсчёта.</p>
          ) : (
            <ul className="vote-scraps">
              {tallies.map((tally) => {
                const player = players.find((p) => p.id === tally.player_id)
                const isOut = eliminatedSet.has(tally.player_id)
                const isTop = tally.votes === maxVotes && maxVotes > 0
                return (
                  <li
                    key={tally.player_id}
                    className={cn('vote-scrap', isTop && 'vote-scrap--top')}
                  >
                    <span className="vote-scrap-name">
                      {player?.name ?? tally.player_id}
                      {isOut ? ' · изгнан' : ''}
                    </span>
                    <span className="vote-scrap-votes tabular-nums">
                      {tally.votes}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </aside>
      </div>
    </PhaseShell>
  )
}
