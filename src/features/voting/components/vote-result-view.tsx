'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { GameTimer } from '@/components/game-timer/game-timer'
import { PlayerCard } from '@/components/player-card/player-card'
import { PhaseShell } from '@/features/room/components/phase-shell'
import {
  beginPresentationRequest,
  nextRevealRoundRequest,
  finishGameRequest,
} from '@/features/room/actions/api-commands'
import { CHARACTERISTIC_CATEGORIES } from '@/lib/constants'
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
    eliminated_player_id?: string
    tallies?: Array<{ player_id: string; votes: number }>
    candidate_ids?: string[]
  }

  const isTie = Boolean(summary?.tie)
  const eliminated = players.find((p) => p.id === summary?.eliminated_player_id)

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
      title="Результат голосования"
      subtitle={`Раунд ${room.current_round}`}
      step={
        isTie
          ? 'Ничья — дальше речи всех игроков, затем переголосование.'
          : 'Дальше новый раунд раскроется автоматически (или вручную ведущим).'
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
      <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
        {isTie ? (
          <div className="rounded-xl border border-amber-700/45 bg-amber-950/35 p-4">
            <p className="font-medium text-amber-100">Ничья</p>
            <p className="mt-1 text-sm text-stone-300">
              Перед переголосованием у каждого будет речь. Кандидаты с равным максимумом голосов.
            </p>
          </div>
        ) : eliminated ? (
          <div className="rounded-xl border border-rose-800/45 bg-rose-950/30 p-4">
            <p className="mb-3 font-medium text-rose-100">Исключён: {eliminated.name}</p>
            <PlayerCard
              player={eliminated}
              compact
              characteristics={characteristics
                .filter((c) => c.player_id === eliminated.id)
                .sort(
                  (a, b) =>
                    CHARACTERISTIC_CATEGORIES.indexOf(a.category) -
                    CHARACTERISTIC_CATEGORIES.indexOf(b.category),
                )}
              showHiddenAsOwner
            />
          </div>
        ) : null}

        <div className="rounded-xl border border-border/50 bg-card/70 p-4">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-stone-500">
            Голоса
          </h3>
          <ul className="flex flex-col gap-2">
            {(summary?.tallies ?? []).map((tally) => {
              const player = players.find((p) => p.id === tally.player_id)
              return (
                <li
                  key={tally.player_id}
                  className="flex items-center justify-between rounded-lg bg-background/40 px-3 py-2 text-sm"
                >
                  <span className="text-stone-200">{player?.name ?? tally.player_id}</span>
                  <span className="font-mono tabular-nums text-stone-50">{tally.votes}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </PhaseShell>
  )
}
