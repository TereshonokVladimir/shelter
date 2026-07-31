'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { RoomHeader } from '@/components/room-header/room-header'
import { LobbyView } from '@/features/lobby/components/lobby-view'
import { PrepView } from '@/features/prep/components/prep-view'
import { RevealView } from '@/features/reveal/components/reveal-view'
import { PresentationView } from '@/features/presentation/components/presentation-view'
import { VotingView } from '@/features/voting/components/voting-view'
import { VoteResultView } from '@/features/voting/components/vote-result-view'
import { ResultsView } from '@/features/results/components/results-view'
import { JoinRoomForm } from '@/features/room/components/join-room-form'
import { RoomWorkspace } from '@/features/room/components/room-workspace'
import { RoomSideNav } from '@/features/room/components/room-side-nav'
import { HostPauseControls } from '@/features/room/components/host-pause-controls'
import {
  fetchRoomSnapshot,
  removeLobbyPlayerRequest,
} from '@/features/room/actions/api-commands'
import { useRoomChannel } from '@/hooks/use-room-channel'
import { ensureBrowserAuth } from '@/lib/api/client'
import type { RoomSnapshot } from '@/lib/api/types'
import { Skeleton } from '@/components/ui/skeleton'

interface RoomClientProps {
  code: string
}

function isPresentationPhase(status: string) {
  return status === 'presentation' || status === 'discussion'
}

export function RoomClient({ code }: RoomClientProps) {
  const router = useRouter()
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null)
  const [needsJoin, setNeedsJoin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [reloadToken, setReloadToken] = useState(0)
  const [pendingRemove, startRemove] = useTransition()
  const [, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false

    async function loadRoom() {
      try {
        await ensureBrowserAuth()
        const result = await fetchRoomSnapshot(code)
        if (cancelled) return
        if (!result.ok) {
          setNeedsJoin(true)
          setSnapshot(null)
        } else {
          setNeedsJoin(false)
          setSnapshot(result.data ?? null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadRoom()
    return () => {
      cancelled = true
    }
  }, [code, reloadToken])

  const onUpdate = useCallback(() => {
    startTransition(() => {
      setReloadToken((value) => value + 1)
    })
  }, [])

  const { isReconnecting } = useRoomChannel({
    roomCode: code,
    enabled: Boolean(snapshot),
    onUpdate,
  })

  useEffect(() => {
    if (!isReconnecting) return
    toast.loading('Переподключение…', {
      id: 'room-reconnect',
      description: 'Восстанавливаем связь с комнатой',
      duration: Infinity,
    })
    return () => {
      toast.dismiss('room-reconnect')
    }
  }, [isReconnecting])

  const wasPausedRef = useRef(false)
  useEffect(() => {
    const paused = Boolean(snapshot?.room.is_paused)
    if (paused && !wasPausedRef.current) {
      toast.warning('Игра на паузе', {
        id: 'room-paused',
        description: 'Таймеры остановлены у всех игроков.',
        duration: 2800,
      })
    }
    if (!paused && wasPausedRef.current) {
      toast.dismiss('room-paused')
    }
    wasPausedRef.current = paused
  }, [snapshot?.room.is_paused])

  if (loading) {
    return (
      <main className="bunker-atmosphere flex h-dvh flex-col overflow-hidden">
        <div className="bunker-dust" aria-hidden />
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <div className="flex h-12 shrink-0 items-center border-b border-amber-900/35 bg-stone-950/80 px-3 sm:h-14 sm:px-4">
            <Skeleton className="h-5 w-28 bg-stone-800/80" />
            <Skeleton className="ml-3 h-5 w-20 bg-stone-800/80" />
          </div>
          <RoomWorkspace>
            <div className="bunker-panel flex h-full min-h-0 flex-col overflow-hidden">
              <div className="bunker-hazard-stripe h-1.5 shrink-0" aria-hidden />
              <div className="flex flex-col gap-3 border-b border-amber-900/30 px-4 py-3">
                <Skeleton className="h-3 w-24 bg-stone-800/80" />
                <Skeleton className="h-7 w-40 bg-stone-800/80" />
                <Skeleton className="h-4 w-full max-w-md bg-stone-800/80" />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <Skeleton className="h-24 w-full bg-stone-800/80" />
                <Skeleton className="h-40 w-full bg-stone-800/80" />
              </div>
            </div>
          </RoomWorkspace>
        </div>
      </main>
    )
  }

  if (needsJoin || !snapshot || !snapshot.me) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-4 py-10">
        <div>
          <h1 className="text-3xl text-stone-50">Вход в комнату {code}</h1>
          <p className="mt-2 text-sm text-stone-400">
            Введите имя, чтобы присоединиться или вернуться в комнату.
          </p>
        </div>
        <JoinRoomForm
          initialCode={code}
          onJoined={() => {
            setLoading(true)
            setReloadToken((value) => value + 1)
            router.refresh()
          }}
        />
      </main>
    )
  }

  const { room, players, me, disaster, bunker, characteristics, events, votes, myVote } =
    snapshot
  const actionCards = snapshot.action_cards ?? []
  const isHost = me.role === 'host'
  const inLobby = room.status === 'lobby'
  const inGame = !inLobby && room.status !== 'finished'
  const mocksEnabled = Boolean(snapshot.mocks_enabled)
  const voteProgress = snapshot.vote_progress ?? {
    cast: 0,
    total: players.filter((p) => p.status === 'active').length,
  }

  function removePlayer(playerId: string) {
    if (!inLobby) return
    startRemove(async () => {
      const result = await removeLobbyPlayerRequest(room.id, playerId)
      if (!result.ok) toast.error(result.error ?? 'Не удалось удалить игрока')
      else onUpdate()
    })
  }

  return (
    <main className="bunker-atmosphere flex h-dvh flex-col overflow-hidden">
      <div className="bunker-dust" aria-hidden />
      <div className="bunker-crop" aria-hidden />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <RoomHeader
          code={room.code}
          status={room.status}
          round={room.current_round}
          isReconnecting={isReconnecting}
          isPaused={Boolean(room.is_paused)}
          actions={
            <RoomSideNav
              room={room}
              players={players}
              meId={me.id}
              isHost={isHost}
              disaster={disaster}
              bunker={bunker}
              events={events}
              showInvite={
                inLobby || room.status === 'prep' || isPresentationPhase(room.status)
              }
              pendingRemove={pendingRemove}
              onRemove={inLobby ? removePlayer : undefined}
              speakingPlayerId={
                isPresentationPhase(room.status) ? room.presentation_player_id : null
              }
              trailing={
                isHost && inGame ? (
                  <HostPauseControls
                    roomId={room.id}
                    isPaused={Boolean(room.is_paused)}
                    onChanged={onUpdate}
                  />
                ) : null
              }
            />
          }
        />

        <RoomWorkspace>
          {room.status === 'lobby' ? (
            <LobbyView
              room={room}
              players={players}
              me={me}
              mocksEnabled={mocksEnabled}
              onChanged={onUpdate}
            />
          ) : null}

          {room.status === 'prep' ? (
            <PrepView
              room={room}
              me={me}
              characteristics={characteristics}
              disaster={snapshot.disaster}
              bunker={snapshot.bunker}
              onChanged={onUpdate}
            />
          ) : null}

          {room.status === 'reveal' ? (
            <RevealView
              room={room}
              players={players}
              me={me}
              characteristics={characteristics}
              actionCards={actionCards}
              mocksEnabled={mocksEnabled}
              onChanged={onUpdate}
            />
          ) : null}

          {isPresentationPhase(room.status) ? (
            <PresentationView
              room={room}
              players={players}
              me={me}
              characteristics={characteristics}
              actionCards={actionCards}
              mocksEnabled={mocksEnabled}
              onChanged={onUpdate}
            />
          ) : null}

          {room.status === 'voting' ? (
            <VotingView
              room={room}
              players={players}
              me={me}
              votes={votes}
              myVote={myVote}
              voteProgress={voteProgress}
              mocksEnabled={mocksEnabled}
              onChanged={onUpdate}
            />
          ) : null}

          {room.status === 'vote_result' ? (
            <VoteResultView
              room={room}
              players={players}
              me={me}
              characteristics={characteristics}
              onChanged={onUpdate}
            />
          ) : null}

          {room.status === 'finished' ? (
            <ResultsView
              room={room}
              players={players}
              characteristics={characteristics}
              finishStats={snapshot.finish_stats}
            />
          ) : null}
        </RoomWorkspace>
      </div>
    </main>
  )
}
