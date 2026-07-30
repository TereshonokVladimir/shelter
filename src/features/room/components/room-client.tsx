'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { RoomHeader } from '@/components/room-header/room-header'
import { LobbyView } from '@/features/lobby/components/lobby-view'
import { RevealView } from '@/features/reveal/components/reveal-view'
import { PresentationView } from '@/features/presentation/components/presentation-view'
import { VotingView } from '@/features/voting/components/voting-view'
import { VoteResultView } from '@/features/voting/components/vote-result-view'
import { ResultsView } from '@/features/results/components/results-view'
import { JoinRoomForm } from '@/features/room/components/join-room-form'
import { PlayersRail } from '@/features/room/components/players-rail'
import { ContextRail } from '@/features/room/components/context-rail'
import { RoomWorkspace } from '@/features/room/components/room-workspace'
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

  if (loading) {
    return (
      <main className="flex h-dvh flex-col overflow-hidden">
        <div className="border-b border-border/40 px-4 py-4">
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-[14rem_1fr_18rem] gap-0">
          <Skeleton className="h-full rounded-none" />
          <div className="flex flex-col gap-4 p-6">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-40 w-full" />
          </div>
          <Skeleton className="h-full rounded-none" />
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
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
      <RoomHeader
        code={room.code}
        status={room.status}
        round={room.current_round}
        isReconnecting={isReconnecting}
        actions={
          isHost && inGame ? (
            <HostPauseControls
              roomId={room.id}
              isPaused={Boolean(room.is_paused)}
              onChanged={onUpdate}
            />
          ) : null
        }
      />

      {room.is_paused ? (
        <div className="bunker-hazard-stripe shrink-0 border-b border-amber-800/40 px-4 py-2 text-center text-sm font-medium text-amber-100">
          Игра на паузе — таймеры остановлены у всех.
        </div>
      ) : null}

      <RoomWorkspace
        left={
          <PlayersRail
            players={players}
            meId={me.id}
            isHost={isHost}
            capacity={room.max_players}
            pending={pendingRemove}
            onRemove={inLobby ? removePlayer : undefined}
            speakingPlayerId={
              room.status === 'presentation' || room.status === 'discussion'
                ? room.presentation_player_id
                : null
            }
          />
        }
        right={
          <ContextRail
            room={room}
            disaster={disaster}
            bunker={bunker}
            events={events}
            showInvite={inLobby || room.status === 'reveal'}
          />
        }
        mobileTop={
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {players.map((player) => (
              <span
                key={player.id}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs ${
                  player.id === room.presentation_player_id &&
                  (room.status === 'presentation' || room.status === 'discussion')
                    ? 'border-amber-400/70 bg-amber-900/50 text-amber-50 ring-1 ring-amber-400/40'
                    : player.id === me.id
                      ? 'border-amber-700/60 bg-amber-950/40 text-amber-100'
                      : player.status === 'eliminated'
                        ? 'border-border/30 text-stone-500'
                        : 'border-border/40 text-stone-300'
                }`}
              >
                {player.name}
                {player.id === room.presentation_player_id &&
                (room.status === 'presentation' || room.status === 'discussion')
                  ? ' · речь'
                  : ''}
              </span>
            ))}
          </div>
        }
        center={
          <>
            {room.status === 'lobby' ? (
              <LobbyView room={room} players={players} me={me} mocksEnabled={mocksEnabled} />
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
          </>
        }
      />
      </div>
    </main>
  )
}
