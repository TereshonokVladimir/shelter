'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { GameTimer } from '@/components/game-timer/game-timer'
import { PlayerCard } from '@/components/player-card/player-card'
import { PlayersCompare } from '@/features/game/components/players-compare'
import { PhaseShell } from '@/features/room/components/phase-shell'
import { startVotingRequest } from '@/features/room/actions/api-commands'
import { CHARACTERISTIC_CATEGORIES } from '@/lib/constants'
import type { Player, PlayerCharacteristicView, Room } from '@/lib/api/types'

interface DiscussionViewProps {
  room: Room
  players: Player[]
  me: Player
  characteristics: PlayerCharacteristicView[]
  onChanged?: () => void
}

export function DiscussionView({
  room,
  players,
  me,
  characteristics,
  onChanged,
}: DiscussionViewProps) {
  const [pending, startTransition] = useTransition()
  const isHost = me.role === 'host'
  const others = players.filter((p) => p.id !== me.id && p.status === 'active')
  const myChars = characteristics
    .filter((c) => c.player_id === me.id)
    .sort(
      (a, b) =>
        CHARACTERISTIC_CATEGORIES.indexOf(a.category) -
        CHARACTERISTIC_CATEGORIES.indexOf(b.category),
    )

  function startVoting() {
    startTransition(async () => {
      const result = await startVotingRequest(room.id)
      if (!result.ok) toast.error(result.error ?? 'Не удалось начать голосование')
      else onChanged?.()
    })
  }

  return (
    <PhaseShell
      title="Обсуждение"
      subtitle="Спорьте по раскрытым фактам. Таймер серверный — фазу двигает ведущий."
      step={
        isHost
          ? 'Когда спор закончен — «Начать голосование» внизу.'
          : 'Обсуждайте вслух. Голосование откроет ведущий.'
      }
      badge={<GameTimer phaseEndsAt={room.phase_ends_at} />}
      footer={
        isHost ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" size="lg" disabled={pending} onClick={startVoting}>
              Начать голосование
            </Button>
          </div>
        ) : (
          <p className="text-sm text-stone-400">Ждём ведущего.</p>
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
          />
        </section>
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
