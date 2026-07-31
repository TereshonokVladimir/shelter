'use client'

import { useTransition } from 'react'
import { Check, Circle } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CopyRoomLink } from '@/components/copy-room-link/copy-room-link'
import {
  ReadyClearanceToggle,
  SquadClearanceMeter,
} from '@/features/lobby/components/ready-clearance'
import { PhaseShell } from '@/features/room/components/phase-shell'
import { MIN_PLAYERS } from '@/lib/constants'
import {
  addMockPlayersRequest,
  setPlayerReadyRequest,
  startGameRequest,
} from '@/features/room/actions/api-commands'
import { cn } from '@/lib/utils'
import type { Player, Room } from '@/lib/api/types'

interface LobbyViewProps {
  room: Room
  players: Player[]
  me: Player
  mocksEnabled?: boolean
  onChanged?: () => void
}

export function LobbyView({
  room,
  players,
  me,
  mocksEnabled = false,
  onChanged,
}: LobbyViewProps) {
  const [pending, startTransition] = useTransition()
  const isHost = me.role === 'host'
  const roster = players.filter((p) => p.status === 'active')
  const activeCount = roster.length
  const readyCount = roster.filter((p) => p.is_ready).length
  const allReady = activeCount >= MIN_PLAYERS && readyCount === activeCount
  const freeSlots = Math.max(0, room.max_players - activeCount)
  const needPlayers = Math.max(0, MIN_PLAYERS - activeCount)
  const waitingNames = roster.filter((p) => !p.is_ready).map((p) => p.name)
  const joinLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join?code=${room.code}`
      : `/join?code=${room.code}`

  function startGame() {
    startTransition(async () => {
      const result = await startGameRequest(room.id)
      if (!result.ok) toast.error(result.error ?? 'Не удалось запустить игру')
      else onChanged?.()
    })
  }

  function toggleReady() {
    const next = !me.is_ready
    startTransition(async () => {
      const result = await setPlayerReadyRequest(room.id, next)
      if (!result.ok) {
        toast.error(result.error ?? 'Не удалось сменить готовность')
        return
      }
      onChanged?.()
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
      toast.success(
        added > 0 ? `Добавлено ботов: ${added}` : 'Боты уже заполняют комнату',
      )
      onChanged?.()
    })
  }

  const step = (() => {
    if (needPlayers > 0) {
      return mocksEnabled
        ? `Нужно ещё ${needPlayers}. Поделитесь кодом или добавьте ботов.`
        : `Нужно ещё ${needPlayers}. Поделитесь кодом комнаты.`
    }
    if (!allReady) {
      return waitingNames.length <= 3
        ? `Шлюз открыт · ждём: ${waitingNames.join(', ')}`
        : `Допуск ${readyCount}/${activeCount} — закройте шлюз все.`
    }
    return isHost
      ? 'Шлюз закрыт — можно начинать операцию.'
      : 'Шлюз закрыт. Ждите старта от ведущего.'
  })()

  return (
    <PhaseShell
      wide
      title="Лобби"
      subtitle={`${readyCount}/${activeCount} допуск · ${activeCount}/${room.max_players} в комнате`}
      step={step}
      footer={
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
          <SquadClearanceMeter
            ready={readyCount}
            total={activeCount}
            className="w-full max-w-sm"
          />
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {isHost && mocksEnabled && freeSlots > 0 ? (
              <Button type="button" variant="outline" disabled={pending} onClick={addMocks}>
                Добавить ботов
              </Button>
            ) : null}
            <ReadyClearanceToggle
              ready={me.is_ready}
              disabled={pending}
              onToggle={toggleReady}
            />
            {isHost ? (
              <Button
                type="button"
                size="lg"
                className="min-w-[9.5rem]"
                disabled={!allReady || pending}
                onClick={startGame}
              >
                {pending ? 'Запуск…' : 'Начать игру'}
              </Button>
            ) : null}
          </div>
        </div>
      }
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 lg:gap-6">
        <section className="flex flex-col gap-3 border-b border-amber-900/25 pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div className="min-w-0 flex-1">
            <p className="bunker-label mb-2">Приглашение</p>
            <CopyRoomLink code={room.code} showQr={false} compact />
          </div>
          <div className="w-fit shrink-0 rounded-md border border-amber-900/35 bg-stone-950/50 p-2">
            <QRCodeSVG value={joinLink} size={96} bgColor="transparent" fgColor="#e7e5e4" />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <p className="bunker-label">Состав · допуск</p>
            {needPlayers > 0 ? (
              <p className="text-xs text-amber-200/80">Не хватает {needPlayers}</p>
            ) : allReady ? (
              <p className="text-xs text-emerald-300/90">Шлюз закрыт</p>
            ) : (
              <p className="text-xs text-stone-500">
                Открыто сегментов: {activeCount - readyCount}
              </p>
            )}
          </div>

          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {roster.map((player) => {
              const isMe = player.id === me.id
              const ready = player.is_ready
              return (
                <li
                  key={player.id}
                  className={cn(
                    'flex items-center gap-3 rounded-md border px-3 py-2.5',
                    ready
                      ? 'border-emerald-800/45 bg-emerald-950/20'
                      : 'border-amber-900/35 bg-stone-950/40',
                    isMe && 'ring-1 ring-amber-600/40',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-full border',
                      ready
                        ? 'border-emerald-700/50 bg-emerald-950/50 text-emerald-300'
                        : 'border-stone-700/60 bg-stone-900/70 text-stone-500',
                    )}
                    aria-hidden
                  >
                    {ready ? <Check className="size-4" /> : <Circle className="size-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-stone-100">
                      {player.name}
                      {isMe ? (
                        <span className="ml-1.5 text-[11px] font-normal text-amber-200/70">вы</span>
                      ) : null}
                    </p>
                    <p className="font-mono text-[10px] tracking-wide text-stone-500 uppercase">
                      {player.role === 'host' ? 'ведущий' : 'игрок'}
                      {' · '}
                      <span className={ready ? 'text-emerald-400/90' : 'text-amber-200/75'}>
                        {ready ? 'допуск' : 'ожидание'}
                      </span>
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </PhaseShell>
  )
}
