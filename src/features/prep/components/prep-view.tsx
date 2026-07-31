'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { GameTimer } from '@/components/game-timer/game-timer'
import { DossierBook } from '@/features/game/components/dossier-book'
import { NotebookProfile } from '@/features/game/components/notebook-profile'
import { ScenarioBrief } from '@/features/game/components/scenario-brief'
import { PhaseShell } from '@/features/room/components/phase-shell'
import { beginPresentationRequest } from '@/features/room/actions/api-commands'
import { CHARACTERISTIC_CATEGORIES, REVEAL_STRATEGIES } from '@/lib/constants'
import type { Bunker, Disaster, Player, PlayerCharacteristicView, Room } from '@/lib/api/types'
import type { RevealStrategyId } from '@/lib/constants'

interface PrepViewProps {
  room: Room
  me: Player
  characteristics: PlayerCharacteristicView[]
  disaster?: Disaster | null
  bunker?: Bunker | null
  onChanged?: () => void
}

export function PrepView({
  room,
  me,
  characteristics,
  disaster,
  bunker,
  onChanged,
}: PrepViewProps) {
  const [pending, startTransition] = useTransition()
  const isHost = me.role === 'host'
  const isPaused = Boolean(room.is_paused)
  const strategy =
    REVEAL_STRATEGIES[(room.reveal_strategy as RevealStrategyId) ?? 'classic'] ??
    REVEAL_STRATEGIES.classic

  const myChars = characteristics
    .filter((c) => c.player_id === me.id)
    .sort(
      (a, b) =>
        CHARACTERISTIC_CATEGORIES.indexOf(a.category) -
        CHARACTERISTIC_CATEGORIES.indexOf(b.category),
    )

  function startTurns() {
    startTransition(async () => {
      const result = await beginPresentationRequest(room.id)
      if (!result.ok) toast.error(result.error ?? 'Не удалось начать ходы')
      else onChanged?.()
    })
  }

  return (
    <PhaseShell
      wide
      title="Ознакомление"
      subtitle="Изучите досье — скоро ходы"
      step={`Стратегия: ${strategy.label}${
        room.reveal_plan?.length ? ` (${room.reveal_plan.join('→')})` : ''
      }. Раскрывать пока нельзя.`}
      badge={
        <GameTimer
          phaseEndsAt={room.phase_ends_at}
          label="До хода"
          paused={isPaused}
          expiredHint="Ходы начнутся автоматически."
        />
      }
      footer={
        isHost ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-stone-500">Таймер или старт вручную.</p>
            <Button type="button" size="lg" disabled={pending || isPaused} onClick={startTurns}>
              Начать ходы
            </Button>
          </div>
        ) : (
          <p className="text-sm text-stone-400">Смотрите карты — скоро очередь.</p>
        )
      }
    >
      <div className="flex w-full flex-col gap-3">
        <ScenarioBrief
          disaster={disaster}
          bunker={bunker}
          shelterCapacity={room.shelter_capacity}
        />

        <DossierBook
          others={[]}
          characteristics={characteristics}
          mine={
            <NotebookProfile
              player={me}
              characteristics={myChars}
              showHiddenAsOwner
            />
          }
        />
      </div>
    </PhaseShell>
  )
}
