'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { FolderOpen } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { GameTimer } from '@/components/game-timer/game-timer'
import { ActionCardsPanel } from '@/features/game/components/action-cards-panel'
import { DossierBook, type DossierBookPage } from '@/features/game/components/dossier-book'
import { DossierSheet } from '@/features/game/components/dossier-sheet'
import { NotebookProfile } from '@/features/game/components/notebook-profile'
import { HostBotsButton } from '@/features/game/components/host-bots-button'
import { PhaseShell } from '@/features/room/components/phase-shell'
import {
  advancePresentationRequest,
  nextRevealRoundRequest,
  revealCharacteristicRequest,
  startVotingRequest,
} from '@/features/room/actions/api-commands'
import { ALWAYS_HIDDEN_COUNT, CHARACTERISTIC_CATEGORIES, REVEAL_STRATEGIES } from '@/lib/constants'
import type { RevealStrategyId } from '@/lib/constants'
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
  mocksEnabled?: boolean
  onChanged?: () => void
}

export function PresentationView({
  room,
  players,
  me,
  characteristics,
  actionCards,
  mocksEnabled = false,
  onChanged,
}: PresentationViewProps) {
  const [pending, startTransition] = useTransition()
  const [bookPage, setBookPage] = useState<DossierBookPage>('mine')
  const [dossierOpen, setDossierOpen] = useState(false)
  const isHost = me.role === 'host'
  const isPaused = Boolean(room.is_paused)
  const order = room.presentation_order ?? []
  const speakerId = room.presentation_player_id
  const speaker = players.find((p) => p.id === speakerId)
  const speakerIndex = speakerId ? order.indexOf(speakerId) : -1
  const isMyTurn = speakerId === me.id

  useEffect(() => {
    setBookPage('mine')
    setDossierOpen(false)
  }, [speakerId])

  const isTieRevote = Boolean((room.last_vote_summary as { tie?: boolean } | undefined)?.tie)
  const canSkipVoting = !isTieRevote
  const others = players.filter((p) => p.id !== me.id && p.status === 'active')
  const quota = room.reveal_quota ?? 0

  const myChars = useMemo(
    () =>
      characteristics
        .filter((c) => c.player_id === me.id)
        .sort(
          (a, b) =>
            CHARACTERISTIC_CATEGORIES.indexOf(a.category) -
            CHARACTERISTIC_CATEGORIES.indexOf(b.category),
        ),
    [characteristics, me.id],
  )

  const speakerCharsCount = useMemo(() => {
    if (!speakerId) return 0
    return characteristics.filter((c) => c.player_id === speakerId && c.is_revealed).length
  }, [characteristics, speakerId])

  const revealedThisRound = myChars.filter(
    (c) =>
      c.is_revealed &&
      c.revealed_round === room.current_round &&
      (c.reveal_source === 'player' || c.reveal_source === 'system'),
  ).length
  const hidden = myChars.filter((c) => !c.is_revealed)
  const remainingQuota = Math.max(0, quota - revealedThisRound)
  const canKeepHidden = hidden.length > ALWAYS_HIDDEN_COUNT
  const canReveal =
    isMyTurn &&
    quota > 0 &&
    remainingQuota > 0 &&
    canKeepHidden &&
    hidden.length > 0 &&
    me.status === 'active'

  const queuePlayers = order
    .map((id) => players.find((p) => p.id === id))
    .filter((p): p is Player => Boolean(p))

  const strategy =
    REVEAL_STRATEGIES[(room.reveal_strategy as RevealStrategyId) ?? 'classic'] ??
    REVEAL_STRATEGIES.classic

  function reveal(id: string) {
    startTransition(async () => {
      const result = await revealCharacteristicRequest(room.id, id)
      if (!result.ok) toast.error(result.error ?? 'Не удалось раскрыть')
      else onChanged?.()
    })
  }

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
    ? quota > 0 && remainingQuota > 0
      ? `Раскройте ещё ${remainingQuota} из ${quota}, затем аргументируйте.`
      : `Ваша речь · ${speakerIndex + 1}/${order.length}.`
    : speaker
      ? `Ход ${speaker.name} · ${speakerIndex + 1}/${order.length}.`
      : 'Ожидание очереди.'

  return (
    <PhaseShell
      wide
      title={`Ход · раунд ${room.current_round}`}
      subtitle={
        isTieRevote
          ? `Речи кандидатов ничьей · ${order.length}`
          : quota > 0
            ? `${strategy.label} · до ${quota} карт`
            : 'Только речи'
      }
      step={step}
      badge={
        <GameTimer
          phaseEndsAt={room.phase_ends_at}
          label={isMyTurn ? 'Ваш ход' : 'Ход'}
          subject={speaker?.name ?? '—'}
          paused={isPaused}
          highlight={isMyTurn}
          expiredHint="Следующий игрок переключится автоматически."
        />
      }
      footer={
        isHost ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-stone-500">
              {speaker ? `${speaker.name} · ${speakerIndex + 1}/${order.length}` : 'Очередь'}
            </p>
            <div className="flex flex-wrap gap-2">
              {mocksEnabled ? (
                <HostBotsButton
                  roomId={room.id}
                  hasBots={players.some(
                    (p) => p.name.startsWith('Бот ') && p.status === 'active',
                  )}
                  onChanged={onChanged}
                  label="Бот на ходе"
                />
              ) : null}
              <Button
                type="button"
                variant="outline"
                disabled={pending || isPaused}
                onClick={skipSpeaker}
              >
                Следующий
              </Button>
              {canSkipVoting ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending || isPaused}
                  onClick={nextRound}
                >
                  Раунд+
                </Button>
              ) : null}
              <Button type="button" disabled={pending || isPaused} onClick={startVoting}>
                К голосованию
              </Button>
            </div>
          </div>
        ) : isMyTurn ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-stone-400">
              Вскройте карты и говорите — или завершите ход раньше.
              {remainingQuota > 0 ? ' Нераскрытая квота откроется случайно.' : null}
            </p>
            <Button
              type="button"
              variant="secondary"
              disabled={pending || isPaused || me.status !== 'active'}
              onClick={skipSpeaker}
            >
              Пропустить ход
            </Button>
          </div>
        ) : (
          <p className="text-sm text-stone-400">
            {speaker ? `Сейчас очередь ${speaker.name}.` : 'Ждите своей очереди.'}
          </p>
        )
      }
    >
      <DossierBook
        page={bookPage}
        onPageChange={setBookPage}
        others={others}
        characteristics={characteristics}
        focusPlayerId={!isMyTurn ? speakerId : null}
        preface={
          speaker ? (
            <section
              className={cn(
                'rounded-lg border px-3 py-2.5 sm:px-4 sm:py-3',
                isMyTurn
                  ? 'border-amber-400/60 bg-amber-950/40 ring-1 ring-amber-400/25'
                  : 'border-amber-800/50 bg-amber-950/25',
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-amber-200/70">
                    {isMyTurn ? 'Ваш ход' : 'Сейчас говорит'}
                  </p>
                  <p className="truncate font-[family-name:var(--font-display)] text-xl tracking-wide text-amber-50 sm:text-2xl">
                    {speaker.name}
                  </p>
                  <p className="text-xs text-stone-400 sm:text-sm">
                    {speakerIndex + 1}/{order.length}
                    {isMyTurn && quota > 0
                      ? ` · ${Math.min(revealedThisRound, quota)}/${quota}`
                      : !isMyTurn
                        ? ` · открыто ${speakerCharsCount}`
                        : null}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {!isMyTurn && speaker ? (
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => setDossierOpen(true)}
                    >
                      <FolderOpen data-icon="inline-start" />
                      Досье
                    </Button>
                  ) : null}
                  {isMyTurn ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={pending || isPaused || me.status !== 'active'}
                      onClick={skipSpeaker}
                    >
                      Пропустить ход
                    </Button>
                  ) : null}
                </div>
              </div>

              {queuePlayers.length > 1 ? (
                <ol className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
                  {queuePlayers.map((player, index) => {
                    const done = speakerIndex >= 0 && index < speakerIndex
                    const current = player.id === speakerId
                    return (
                      <li
                        key={player.id}
                        className={cn(
                          'shrink-0 rounded-md border px-2 py-1 text-[11px]',
                          current
                            ? 'border-amber-400/70 bg-amber-900/50 text-amber-50'
                            : done
                              ? 'border-border/30 text-stone-500 line-through'
                              : 'border-border/40 text-stone-300',
                        )}
                      >
                        {index + 1}. {player.name}
                      </li>
                    )
                  })}
                </ol>
              ) : null}
            </section>
          ) : null
        }
        hasActions
        actions={
          <ActionCardsPanel
            roomId={room.id}
            meId={me.id}
            players={players}
            myCharacteristics={myChars}
            actionCards={actionCards}
            disabled={pending || isPaused || me.status !== 'active' || !isMyTurn}
            onChanged={onChanged}
          />
        }
        mine={
          <NotebookProfile
            player={me}
            characteristics={myChars}
            showHiddenAsOwner
            canReveal={canReveal}
            revealPending={pending}
            onReveal={canReveal ? reveal : undefined}
          />
        }
      />

      <DossierSheet
        open={dossierOpen}
        onOpenChange={setDossierOpen}
        player={speaker ?? null}
        characteristics={characteristics}
      />
    </PhaseShell>
  )
}
