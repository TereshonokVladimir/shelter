'use client'

import { useState, useTransition } from 'react'
import { Check, Vote as VoteIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { GameTimer } from '@/components/game-timer/game-timer'
import { PhaseShell } from '@/features/room/components/phase-shell'
import { completeVotingRequest, submitVoteRequest } from '@/features/room/actions/api-commands'
import { HostBotsButton } from '@/features/game/components/host-bots-button'
import { cn } from '@/lib/utils'
import type { Player, Room, Vote } from '@/lib/api/types'

interface VotingViewProps {
  room: Room
  players: Player[]
  me: Player
  votes: Vote[]
  myVote: Vote | null
  voteProgress: { cast: number; total: number }
  mocksEnabled?: boolean
  onChanged?: () => void
}

export function VotingView({
  room,
  players,
  me,
  votes: _votes,
  myVote,
  voteProgress,
  mocksEnabled = false,
  onChanged,
}: VotingViewProps) {
  const [pending, startTransition] = useTransition()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const isHost = me.role === 'host'
  const isPaused = Boolean(room.is_paused)

  const candidates = players.filter((p) => {
    if (p.status !== 'active') return false
    if (room.voting_candidate_ids?.length) {
      return room.voting_candidate_ids.includes(p.id)
    }
    return true
  })

  const progress = voteProgress.total
    ? Math.round((voteProgress.cast / voteProgress.total) * 100)
    : 0
  const allVoted =
    voteProgress.total > 0 && voteProgress.cast >= voteProgress.total
  void _votes
  const selected = candidates.find((c) => c.id === selectedId)
  const votedFor = myVote
    ? players.find((p) => p.id === myVote.target_player_id)?.name
    : null

  function openConfirm() {
    if (!selectedId || myVote || selectedId === me.id) return
    setConfirmOpen(true)
  }

  function confirmVote() {
    if (!selectedId) return
    startTransition(async () => {
      const result = await submitVoteRequest(room.id, selectedId)
      setConfirmOpen(false)
      if (!result.ok) toast.error(result.error ?? 'Не удалось проголосовать')
      else {
        toast.success('Голос принят')
        onChanged?.()
      }
    })
  }

  function complete() {
    startTransition(async () => {
      const result = await completeVotingRequest(room.id)
      if (!result.ok) toast.error(result.error ?? 'Не удалось завершить голосование')
      else onChanged?.()
    })
  }

  const step = myVote
    ? `Голос отдан${votedFor ? ` за «${votedFor}»` : ''}. Чужие выборы скрыты до конца.`
    : selected
      ? `Выбрано: ${selected.name}. Нажмите кнопку внизу, чтобы подтвердить.`
      : 'Выберите игрока (не себя). Если не успеете — голос уйдёт в вас самих.'

  return (
    <PhaseShell
      title="Голосование"
      subtitle="Кого исключить? По таймеру не проголосовавшие автоматически голосуют за себя."
      step={step}
      badge={
        <GameTimer
          phaseEndsAt={room.phase_ends_at}
          label="До итогов"
          paused={isPaused}
          expiredHint="Непроголосовавшие получат голос за себя, затем результат."
        />
      }
      footer={
        <div className="flex flex-col gap-3">
          {!myVote ? (
            <Button
              type="button"
              size="lg"
              className="h-12 w-full text-base sm:w-auto sm:min-w-64"
              disabled={!selectedId || selectedId === me.id || pending || isPaused}
              onClick={openConfirm}
            >
              <VoteIcon data-icon="inline-start" />
              {selected
                ? `Исключить: ${selected.name}`
                : 'Сначала выберите игрока выше'}
            </Button>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-800/40 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
              <Check className="size-4 shrink-0" />
              Голос учтён{votedFor ? ` · ${votedFor}` : ''}. Ждём остальных.
            </div>
          )}

          {isHost ? (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3">
              <p className="text-xs text-stone-500">
                Проголосовало {voteProgress.cast} из {voteProgress.total}
              </p>
              <div className="flex flex-wrap gap-2">
                {mocksEnabled ? (
                  <HostBotsButton
                    roomId={room.id}
                    hasBots={players.some(
                      (p) => p.name.startsWith('Бот ') && p.status === 'active',
                    )}
                    onChanged={onChanged}
                    label="Боты голосуют"
                  />
                ) : null}
                <Button
                  type="button"
                  disabled={!allVoted || pending || isPaused}
                  onClick={complete}
                >
                  Показать результат
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      }
    >
      <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-sm text-stone-300">
            <span>Прогресс голосования</span>
            <span className="font-mono tabular-nums">
              {voteProgress.cast}/{voteProgress.total}
            </span>
          </div>
          <Progress value={progress} />
        </div>

        <ul className="flex flex-col gap-2.5">
          {candidates.map((player) => {
            const isSelf = player.id === me.id
            const isSelected = selectedId === player.id
            const disabled = Boolean(myVote) || isSelf || pending

            return (
              <li key={player.id}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => setSelectedId(player.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition',
                    'disabled:cursor-not-allowed disabled:opacity-45',
                    isSelected && !myVote
                      ? 'border-amber-500/60 bg-amber-950/45 ring-1 ring-amber-500/35'
                      : 'border-border/60 bg-card/80 hover:border-stone-500/50 hover:bg-stone-900/60',
                    myVote?.target_player_id === player.id &&
                      'border-emerald-600/50 bg-emerald-950/35',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-full border',
                      isSelected || myVote?.target_player_id === player.id
                        ? 'border-amber-400 bg-amber-400 text-stone-950'
                        : 'border-stone-500',
                    )}
                    aria-hidden
                  >
                    {isSelected || myVote?.target_player_id === player.id ? (
                      <Check className="size-3" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-stone-50">{player.name}</span>
                    <span className="block text-xs text-stone-500">
                      {isSelf
                        ? 'За себя голосовать нельзя'
                        : myVote
                          ? myVote.target_player_id === player.id
                            ? 'Ваш выбор'
                            : 'Кандидат'
                          : 'Нажмите, чтобы выбрать'}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтвердить голос</DialogTitle>
            <DialogDescription>
              Голос нельзя изменить. Исключить «{selected?.name}»?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              Отмена
            </Button>
            <Button type="button" disabled={pending} onClick={confirmVote}>
              Да, исключить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PhaseShell>
  )
}
