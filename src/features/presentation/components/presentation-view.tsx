'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { GameTimer } from '@/components/game-timer/game-timer'
import { PlayerCard } from '@/components/player-card/player-card'
import { ActionCardsPanel } from '@/features/game/components/action-cards-panel'
import { PlayersCompare } from '@/features/game/components/players-compare'
import { PhaseShell } from '@/features/room/components/phase-shell'
import {
  advancePresentationRequest,
  nextRevealRoundRequest,
  startVotingRequest,
} from '@/features/room/actions/api-commands'
import { CHARACTERISTIC_CATEGORIES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type {
  Player,
  PlayerActionCardView,
  PlayerCharacteristicView,
  Room,
} from '@/lib/api/types'

interface PresentationViewProps {
  room: Room
  players: Player[]
  me: Player
  characteristics: PlayerCharacteristicView[]
  actionCards: PlayerActionCardView[]
  onChanged?: () => void
}

export function PresentationView({
  room,
  players,
  me,
  characteristics,
  actionCards,
  onChanged,
}: PresentationViewProps) {
  const [pending, startTransition] = useTransition()
  const isHost = me.role === 'host'
  const isPaused = Boolean(room.is_paused)
  const order = room.presentation_order ?? []
  const speakerId = room.presentation_player_id
  const speaker = players.find((p) => p.id === speakerId)
  const speakerIndex = speakerId ? order.indexOf(speakerId) : -1
  const isMyTurn = speakerId === me.id
  const isTieRevote = Boolean((room.last_vote_summary as { tie?: boolean } | undefined)?.tie)
  const canSkipVoting = !isTieRevote
  const others = players.filter((p) => p.id !== me.id && p.status === 'active')
  const myChars = characteristics
    .filter((c) => c.player_id === me.id)
    .sort(
      (a, b) =>
        CHARACTERISTIC_CATEGORIES.indexOf(a.category) -
        CHARACTERISTIC_CATEGORIES.indexOf(b.category),
    )

  const queuePlayers = order
    .map((id) => players.find((p) => p.id === id))
    .filter((p): p is Player => Boolean(p))

  function skipSpeaker() {
    startTransition(async () => {
      const result = await advancePresentationRequest(room.id)
      if (!result.ok) toast.error(result.error ?? 'Не удалось переключить речь')
      else onChanged?.()
    })
  }

  function startVoting() {
    startTransition(async () => {
      const result = await startVotingRequest(room.id)
      if (!result.ok) toast.error(result.error ?? 'Не удалось начать голосование')
      else onChanged?.()
    })
  }

  function nextRound() {
    startTransition(async () => {
      const result = await nextRevealRoundRequest(room.id)
      if (!result.ok) toast.error(result.error ?? 'Не удалось перейти к следующему раунду')
      else onChanged?.()
    })
  }

  const step = isMyTurn
    ? `Ваша речь · ${speakerIndex + 1} из ${order.length}. Расскажите о себе по открытым характеристикам.`
    : speaker
      ? `Сейчас говорит ${speaker.name} · ${speakerIndex + 1} из ${order.length}. Слушайте.`
      : 'Ожидание очереди речей.'

  return (
    <PhaseShell
      title="Самопрезентация"
      subtitle={
        isTieRevote
          ? 'Речи перед переголосованием. После всех — голосование по кандидатам.'
          : 'Каждый говорит по своему таймеру. Дальше — голосование или следующий раунд.'
      }
      step={step}
      badge={
        <GameTimer
          phaseEndsAt={room.phase_ends_at}
          label={isMyTurn ? 'Ваша речь' : 'Речь игрока'}
          subject={speaker?.name ?? '—'}
          paused={isPaused}
          highlight={isMyTurn}
          expiredHint="Следующий игрок переключится автоматически."
        />
      }
      footer={
        isHost ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-stone-500">
              {speaker
                ? `Сейчас: ${speaker.name} (${speakerIndex + 1}/${order.length})`
                : 'Очередь речей'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={pending || isPaused}
                onClick={skipSpeaker}
              >
                Следующий игрок
              </Button>
              {canSkipVoting ? (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  disabled={pending || isPaused}
                  onClick={nextRound}
                >
                  Следующий раунд
                </Button>
              ) : null}
              <Button
                type="button"
                size="lg"
                disabled={pending || isPaused}
                onClick={startVoting}
              >
                К голосованию
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-stone-400">
            {isMyTurn
              ? 'Говорите — у всех тикает ваш таймер.'
              : speaker
                ? `Ждите: сейчас очередь ${speaker.name}.`
                : 'Ждите своей очереди.'}
          </p>
        )
      }
    >
      <div className="flex flex-col gap-8">
        {speaker ? (
          <section
            className={cn(
              'rounded-xl border p-5',
              isMyTurn
                ? 'border-amber-400/60 bg-amber-950/40 ring-2 ring-amber-400/25'
                : 'border-amber-800/50 bg-amber-950/25',
            )}
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-amber-200/70">
                  {isMyTurn ? 'Говорите вы' : 'Сейчас говорит'}
                </p>
                <p className="mt-1 text-3xl tracking-wide text-amber-50">{speaker.name}</p>
                <p className="mt-2 text-sm text-stone-300">
                  Ход {speakerIndex + 1} из {order.length}
                  {isMyTurn
                    ? ' — убедите остальных, что место в убежище должно достаться вам.'
                    : ' — слушайте аргументы.'}
                </p>
              </div>
            </div>

            {queuePlayers.length > 1 ? (
              <ol className="mt-4 flex flex-wrap gap-2">
                {queuePlayers.map((player, index) => {
                  const done = speakerIndex >= 0 && index < speakerIndex
                  const current = player.id === speakerId
                  return (
                    <li
                      key={player.id}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs',
                        current
                          ? 'border-amber-400/70 bg-amber-900/50 text-amber-50'
                          : done
                            ? 'border-border/30 text-stone-500 line-through'
                            : 'border-border/40 text-stone-300',
                      )}
                    >
                      {index + 1}. {player.name}
                      {player.id === me.id ? ' (вы)' : ''}
                    </li>
                  )
                })}
              </ol>
            ) : null}
          </section>
        ) : null}

        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-stone-500">
            Ваш персонаж
          </h3>
          <PlayerCard
            player={me}
            characteristics={myChars}
            isSelf
            showHiddenAsOwner
            columns={2}
          />
        </section>

        <ActionCardsPanel
          roomId={room.id}
          meId={me.id}
          players={players}
          myCharacteristics={myChars}
          actionCards={actionCards}
          disabled={pending || isPaused || me.status !== 'active'}
          onChanged={onChanged}
        />

        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-stone-500">
            Остальные игроки
          </h3>
          <PlayersCompare
            players={others}
            characteristics={characteristics}
            revealedOnly
            emptyLabel="Ещё ничего не раскрыто"
          />
        </section>
      </div>
    </PhaseShell>
  )
}
