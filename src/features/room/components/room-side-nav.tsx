'use client'

import { useState } from 'react'
import { ScrollText, Users, Waypoints } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlayersRail } from '@/features/room/components/players-rail'
import { ContextRail } from '@/features/room/components/context-rail'
import type { Bunker, Disaster, GameEvent, Player, Room } from '@/lib/api/types'

type NavTab = 'players' | 'scenario' | 'events'

interface RoomSideNavProps {
  room: Room
  players: Player[]
  meId: string
  isHost: boolean
  disaster: Disaster | null
  bunker: Bunker | null
  events: GameEvent[]
  showInvite?: boolean
  pendingRemove?: boolean
  onRemove?: (playerId: string) => void
  speakingPlayerId?: string | null
  /** Extra actions (pause etc.) rendered after nav buttons */
  trailing?: React.ReactNode
}

export function RoomSideNav({
  room,
  players,
  meId,
  isHost,
  disaster,
  bunker,
  events,
  showInvite = false,
  pendingRemove,
  onRemove,
  speakingPlayerId,
  trailing,
}: RoomSideNavProps) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<NavTab>('players')
  const active = players.filter((p) => p.status === 'active').length

  function openTab(next: NavTab) {
    setTab(next)
    setOpen(true)
  }

  return (
    <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 px-2 text-stone-300"
        onClick={() => openTab('players')}
      >
        <Users data-icon="inline-start" />
        <span className="hidden sm:inline">Игроки</span>
        <span className="font-mono text-[11px] text-stone-500">{active}</span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 px-2 text-stone-300"
        onClick={() => openTab('scenario')}
      >
        <Waypoints data-icon="inline-start" />
        <span className="hidden sm:inline">Сценарий</span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 px-2 text-stone-300"
        onClick={() => openTab('events')}
      >
        <ScrollText data-icon="inline-start" />
        <span className="hidden md:inline">Лог</span>
      </Button>
      {trailing}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex h-dvh flex-col gap-0 border-amber-900/40 bg-stone-950 p-0 sm:max-w-md"
        >
          <SheetHeader className="border-b border-border/40 pr-12">
            <SheetTitle>Навигация комнаты</SheetTitle>
            <SheetDescription>
              Игроки, сценарий и события — без лишней полосы на экране.
            </SheetDescription>
          </SheetHeader>

          <Tabs
            value={tab}
            onValueChange={(value) => {
              if (value === 'players' || value === 'scenario' || value === 'events') {
                setTab(value)
              }
            }}
            className="flex min-h-0 flex-1 flex-col gap-0"
          >
            <div className="border-b border-border/40 px-3 py-2">
              <TabsList variant="line" className="w-full">
                <TabsTrigger value="players" className="flex-1">
                  Игроки
                </TabsTrigger>
                <TabsTrigger value="scenario" className="flex-1">
                  Сценарий
                </TabsTrigger>
                <TabsTrigger value="events" className="flex-1">
                  Лог
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="players"
              className="min-h-0 flex-1 overflow-hidden data-[hidden]:hidden"
            >
              <PlayersRail
                embedded
                players={players}
                meId={meId}
                isHost={isHost}
                capacity={room.shelter_capacity ?? room.max_players}
                pending={pendingRemove}
                onRemove={onRemove}
                speakingPlayerId={speakingPlayerId}
                showReady={room.status === 'lobby'}
              />
            </TabsContent>

            <TabsContent
              value="scenario"
              className="min-h-0 flex-1 overflow-hidden data-[hidden]:hidden"
            >
              <ContextRail
                embedded
                mode="scenario"
                room={room}
                disaster={disaster}
                bunker={bunker}
                events={events}
                showInvite={showInvite}
              />
            </TabsContent>

            <TabsContent
              value="events"
              className="min-h-0 flex-1 overflow-hidden data-[hidden]:hidden"
            >
              <ContextRail
                embedded
                mode="events"
                room={room}
                disaster={disaster}
                bunker={bunker}
                events={events}
                showInvite={false}
              />
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </div>
  )
}
