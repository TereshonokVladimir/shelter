'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { GameTimer } from '@/components/game-timer/game-timer'
import { PlayerCard } from '@/components/player-card/player-card'
import { ActionCardsPanel } from '@/features/game/components/action-cards-panel'
import { HostBotsButton } from '@/features/game/components/host-bots-button'
import { PlayersCompare } from '@/features/game/components/players-compare'
import { PhaseShell } from '@/features/room/components/phase-shell'
import {
  beginPresentationRequest,
  revealCharacteristicRequest,
} from '@/features/room/actions/api-commands'
import { ALWAYS_HIDDEN_COUNT, CHARACTERISTIC_CATEGORIES } from '@/lib/constants'
import type { Player, PlayerActionCardView, PlayerCharacteristicView, Room } from '@/lib/api/types'

interface RevealViewProps {
  room: Room
  players: Player[]
  me: Player
  characteristics: PlayerCharacteristicView[]
  actionCards: PlayerActionCardView[]
  mocksEnabled?: boolean
  onChanged?: () => void
}

export function RevealView({
  room,
  players,
  me,
  characteristics,
  actionCards,
  mocksEnabled = false,
  onChanged,
}: RevealViewProps) {
  const [pending, startTransition] = useTransition()
  const isHost = me.role === 'host'
  const isPaused = Boolean(room.is_paused)
  const quota = room.reveal_quota ?? 0
  const myChars = characteristics
    .filter((c) => c.player_id === me.id)
    .sort(
      (a, b) =>
        CHARACTERISTIC_CATEGORIES.indexOf(a.category) -
        CHARACTERISTIC_CATEGORIES.indexOf(b.category),
    )
  const revealedThisRound = myChars.filter(
    (c) => c.is_revealed && c.revealed_round === room.current_round,
  ).length
  const hidden = myChars.filter((c) => !c.is_revealed)
  const others = players.filter((p) => p.id !== me.id)
  const remainingQuota = Math.max(0, quota - revealedThisRound)
  const canKeepHidden = hidden.length > ALWAYS_HIDDEN_COUNT
  const canReveal = remainingQuota > 0 && canKeepHidden && hidden.length > 0

  function reveal(id: string) {
    startTransition(async () => {
      const result = await revealCharacteristicRequest(room.id, id)
      if (!result.ok) toast.error(result.error ?? 'Не удалось раскрыть')
      else onChanged?.()
    })
  }

  function toPresentation() {
    startTransition(async () => {
      const result = await beginPresentationRequest(room.id)
      if (!result.ok) toast.error(result.error ?? 'Не удалось перейти к речам')
      else onChanged?.()
    })
  }

  const step =
    quota === 0
      ? 'В этом раунде раскрытий нет — ждите перехода к речам.'
      : canReveal
        ? `Раскройте ещё ${remainingQuota} из ${quota} в этом раунде. Одна характеристика останется скрытой до конца.`
        : remainingQuota === 0
          ? `Лимит раунда исчерпан (${quota}). Ждите речей или конца таймера.`
          : 'Одна характеристика должна остаться скрытой.'

  return (
    <PhaseShell
      title={`Раскрытие · раунд ${room.current_round}`}
      subtitle={`План: 3 → 2 → 2. Сейчас можно открыть до ${quota}. Одна всегда остаётся скрытой.`}
      step={step}
      badge={
        <GameTimer
          phaseEndsAt={room.phase_ends_at}
          label="До речей"
          paused={isPaused}
          expiredHint="Переход к речам произойдёт автоматически."
        />
      }
      footer={
        isHost ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-stone-500">
              Раскрыто у вас: {revealedThisRound}/{quota}
            </p>
            <div className="flex flex-wrap gap-2">
              {mocksEnabled ? (
                <HostBotsButton
                  roomId={room.id}
                  hasBots={players.some(
                    (p) => p.name.startsWith('Бот ') && p.status === 'active',
                  )}
                  onChanged={onChanged}
                  label="Боты раскрывают"
                />
              ) : null}
              <Button
                type="button"
                size="lg"
                disabled={pending || isPaused}
                onClick={toPresentation}
              >
                Дальше: речи
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-stone-400">
            Раскрыто: {revealedThisRound}/{quota}. Дальше фаза переключится по таймеру.
          </p>
        )
      }
    >
      <div className="flex flex-col gap-8">
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
            canReveal={canReveal}
            revealPending={pending || isPaused}
            onReveal={reveal}
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

        <section className="flex min-h-0 flex-col gap-3">
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
