'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { PhaseShell } from '@/features/room/components/phase-shell'
import { MIN_PLAYERS } from '@/lib/constants'
import { addMockPlayersRequest, startGameRequest } from '@/features/room/actions/api-commands'
import type { Player, Room } from '@/lib/api/types'

interface LobbyViewProps {
  room: Room
  players: Player[]
  me: Player
  mocksEnabled?: boolean
}

export function LobbyView({ room, players, me, mocksEnabled = false }: LobbyViewProps) {
  const [pending, startTransition] = useTransition()
  const isHost = me.role === 'host'
  const activeCount = players.filter((p) => p.status === 'active').length
  const canStart = activeCount >= MIN_PLAYERS
  const freeSlots = Math.max(0, room.max_players - activeCount)
  const need = Math.max(0, MIN_PLAYERS - activeCount)

  function startGame() {
    startTransition(async () => {
      const result = await startGameRequest(room.id)
      if (!result.ok) toast.error(result.error ?? 'Не удалось запустить игру')
    })
  }

  function addMocks() {
    startTransition(async () => {
      const result = await addMockPlayersRequest(room.id)
      if (!result.ok) {
        toast.error(result.error ?? 'Не удалось добавить ботов')
        return
      }
      const added = (result.data as { added?: number } | undefined)?.added ?? 0
      toast.success(added > 0 ? `Добавлено ботов: ${added}` : 'Боты уже заполняют комнату')
    })
  }

  return (
    <PhaseShell
      title="Лобби"
      subtitle={`Свободно ${freeSlots} из ${room.max_players}. Игроки слева, код и QR справа.`}
      step={
        isHost
            ? canStart
              ? 'Состав готов. Нажмите «Начать игру» внизу.'
              : mocksEnabled
                ? `Нужно ещё ${need}. Добавьте людей по коду или ботов для теста.`
                : `Нужно ещё ${need}. Поделитесь кодом справа.`
            : 'Ждите, пока ведущий запустит игру.'
      }
      footer={
        isHost ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-stone-500">
              {activeCount}/{room.max_players} · мин. {MIN_PLAYERS}
            </p>
            <div className="flex flex-wrap gap-2">
              {mocksEnabled && freeSlots > 0 ? (
                <Button type="button" variant="outline" disabled={pending} onClick={addMocks}>
                  Добавить ботов
                </Button>
              ) : null}
              <Button
                type="button"
                size="lg"
                disabled={!canStart || pending}
                onClick={startGame}
              >
                {pending ? 'Запуск…' : 'Начать игру'}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-stone-400">Ожидайте старта от ведущего.</p>
        )
      }
    >
      <div className="max-w-xl">
        {!canStart ? (
          <Alert>
            <AlertTitle>Не хватает игроков</AlertTitle>
            <AlertDescription>
              Минимум {MIN_PLAYERS}, сейчас {activeCount}.
              {mocksEnabled
                ? ' Поделитесь кодом справа или добавьте ботов.'
                : ' Поделитесь кодом справа.'}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/25 px-4 py-3 text-sm text-emerald-100">
            Состав готов — можно начинать.
          </div>
        )}
      </div>
    </PhaseShell>
  )
}
