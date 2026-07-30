'use client'

import { EventFeed } from '@/features/game/components/event-feed'
import { CopyRoomLink } from '@/components/copy-room-link/copy-room-link'
import type { Bunker, Disaster, GameEvent, Room } from '@/lib/api/types'

interface ContextRailProps {
  room: Room
  disaster: Disaster | null
  bunker: Bunker | null
  events: GameEvent[]
  showInvite?: boolean
}

export function ContextRail({
  room,
  disaster,
  bunker,
  events,
  showInvite = false,
}: ContextRailProps) {
  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-border/50 bg-stone-900/55">
      <div className="scrollbar-none flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto py-4 pr-4 pl-10">
        {showInvite ? (
          <section>
            <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-stone-500">Приглашение</p>
            <CopyRoomLink code={room.code} showQr compact />
          </section>
        ) : null}

        {disaster || bunker ? (
          <section className="flex flex-col gap-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">Сценарий</p>
            {disaster ? (
              <div className="rounded-lg border border-red-900/35 bg-red-950/25 p-3">
                <p className="text-xs text-red-200/80">Катастрофа</p>
                <p className="mt-1 text-sm font-medium text-stone-100">{disaster.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-stone-400">{disaster.description}</p>
              </div>
            ) : null}
            {bunker ? (
              <div className="rounded-lg border border-emerald-900/35 bg-emerald-950/25 p-3">
                <p className="text-xs text-emerald-200/80">
                  Убежище{room.shelter_capacity != null ? ` · ${room.shelter_capacity} мест` : ''}
                </p>
                <p className="mt-1 text-sm font-medium text-stone-100">{bunker.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-stone-400">{bunker.description}</p>
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="flex min-h-0 flex-1 flex-col">
          <EventFeed events={events} compact />
        </section>
      </div>
    </aside>
  )
}
