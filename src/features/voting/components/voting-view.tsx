'use client'

import { useState, useTransition } from 'react'
import { Check, Vote as VoteIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
  const allVoted = voteProgress.total > 0 && voteProgress.cast >= voteProgress.total
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

  const seatsOut = Math.max(1, room.eliminations_this_round ?? 1)
  const step = myVote
    ? allVoted
      ? 'Все проголосовали — итоги сейчас.'
      : `Голос отдан${votedFor ? ` за «${votedFor}»` : ''}. Ждём остальных.`
    : selected
      ? `Выбрано: ${selected.name}. Подтвердите внизу.`
      : 'Выберите игрока (не себя).'

  return (
    <>
      <PhaseShell
        wide
        title="Голосование"
        subtitle={
          seatsOut > 1
            ? `Исключить ${seatsOut} · голосуйте за одного`
            : 'Кого исключить?'
        }
        step={step}
        badge={
          <GameTimer
            phaseEndsAt={room.phase_ends_at}
            label="До итогов"
            paused={isPaused}
            expiredHint={
              allVoted
                ? 'Итоги подводятся автоматически.'
                : 'Непроголосовавшие получат автоголос по таймеру.'
            }
          />
        }
        footer={
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            {!myVote ? (
              <Button
                type="button"
                size="lg"
                className="h-11 w-full text-base sm:w-auto sm:min-w-56"
                disabled={!selectedId || selectedId === me.id || pending || isPaused}
                onClick={openConfirm}
              >
                <VoteIcon data-icon="inline-start" />
                {selected ? `Исключить: ${selected.name}` : 'Выберите игрока'}
              </Button>
            ) : (
              <div className="vote-cast-note">
                <Check className="size-4 shrink-0" aria-hidden />
                <span>
                  Бюллетень принят{votedFor ? ` · ${votedFor}` : ''}.
                </span>
              </div>
            )}

            {isHost ? (
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-mono text-xs tabular-nums text-stone-500">
                  {voteProgress.cast}/{voteProgress.total}
                </p>
                {mocksEnabled ? (
                  <HostBotsButton
                    roomId={room.id}
                    hasBots={players.some(
                      (p) => p.name.startsWith('Бот ') && p.status === 'active',
                    )}
                    onChanged={onChanged}
                    label="Боты"
                  />
                ) : null}
                <Button
                  type="button"
                  disabled={!allVoted || pending || isPaused}
                  onClick={complete}
                >
                  Результат
                </Button>
              </div>
            ) : null}
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <div className="vote-ballot-progress">
            <div className="flex items-baseline justify-between gap-3">
              <p className="vote-ballot-progress-label">Собрано голосов</p>
              <p className="vote-ballot-progress-count">
                {voteProgress.cast}
                <span className="opacity-55">/{voteProgress.total}</span>
              </p>
            </div>
            <div className="vote-ballot-progress-track" aria-hidden>
              <div
                className="vote-ballot-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="vote-ballot-progress-hint">
              {allVoted
                ? 'Все отметились — можно смотреть итог.'
                : 'Отметьте имя на бюллетене ниже.'}
            </p>
          </div>

          <ul className="vote-ballot-grid">
            {candidates.map((player) => {
              const isSelf = player.id === me.id
              const isSelected = selectedId === player.id
              const disabled = Boolean(myVote) || isSelf || pending
              const isMine = myVote?.target_player_id === player.id

              return (
                <li key={player.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setSelectedId(player.id)}
                    className={cn(
                      'vote-ballot',
                      isSelected && !myVote && 'vote-ballot--selected',
                      isMine && 'vote-ballot--cast',
                      isSelf && 'vote-ballot--self',
                    )}
                  >
                    <span className="vote-ballot-mark" aria-hidden>
                      {isSelected || isMine ? <Check className="size-3.5" /> : null}
                    </span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="vote-ballot-name">{player.name}</span>
                      <span className="vote-ballot-meta">
                        {isSelf
                          ? 'свой голос нельзя'
                          : isMine
                            ? 'ваш выбор'
                            : isSelected
                              ? 'отмечено →'
                              : 'кандидат'}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </PhaseShell>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="vote-confirm-dialog">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-display)] tracking-wide">
              Подтвердить бюллетень?
            </DialogTitle>
            <DialogDescription>
              Исключить «{selected?.name}». До конца фазы голос ещё можно сменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              Отмена
            </Button>
            <Button type="button" disabled={pending} onClick={confirmVote}>
              Подтвердить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
