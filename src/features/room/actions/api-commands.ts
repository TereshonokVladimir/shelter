'use client'

import { apiFetch } from '@/lib/api/client'
import type { ActionResult } from '@/types/common'
import type { ContentPackageSummary, RoomSnapshot } from '@/lib/api/types'

function toResult<T>(promise: Promise<T>): Promise<ActionResult<T>> {
  return promise
    .then((data) => ({ ok: true as const, data }))
    .catch((error: unknown) => ({
      ok: false as const,
      error: error instanceof Error ? error.message : String(error),
    }))
}

export async function createRoomRequest(input: {
  name: string
  maxPlayers: number
  presentationDurationSec: number
  votingDurationSec: number
  prepDurationSec: number
  revealStrategy: string
  packageId: string
}) {
  return toResult(
    apiFetch<{ room: { id: string; code: string }; player: { id: string } }>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  )
}

export async function listPackagesRequest() {
  return toResult(apiFetch<ContentPackageSummary[]>('/api/packages'))
}

export async function joinRoomRequest(input: { code: string; name: string }) {
  return toResult(
    apiFetch<{ room: { id: string; code: string }; player: { id: string } }>('/api/rooms/join', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  )
}

export async function fetchRoomSnapshot(code: string) {
  return toResult(apiFetch<RoomSnapshot>(`/api/rooms/${encodeURIComponent(code)}`))
}

export async function removeLobbyPlayerRequest(roomId: string, playerId: string) {
  return toResult(
    apiFetch(`/api/rooms/${roomId}/remove-player`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    }),
  )
}

export async function addMockPlayersRequest(roomId: string, count?: number) {
  return toResult(
    apiFetch(`/api/rooms/${roomId}/mock-players`, {
      method: 'POST',
      body: JSON.stringify(count != null ? { count } : {}),
    }),
  )
}

export async function runBotsRequest(roomId: string) {
  return toResult(apiFetch(`/api/rooms/${roomId}/bots/act`, { method: 'POST' }))
}

export async function startGameRequest(roomId: string) {
  return toResult(apiFetch(`/api/rooms/${roomId}/start`, { method: 'POST' }))
}

export async function setPlayerReadyRequest(roomId: string, ready: boolean) {
  return toResult(
    apiFetch(`/api/rooms/${roomId}/ready`, {
      method: 'POST',
      body: JSON.stringify({ ready }),
    }),
  )
}

export async function revealCharacteristicRequest(
  roomId: string,
  playerCharacteristicId: string,
) {
  return toResult(
    apiFetch(`/api/rooms/${roomId}/reveal`, {
      method: 'POST',
      body: JSON.stringify({ playerCharacteristicId }),
    }),
  )
}

export async function playActionCardRequest(
  roomId: string,
  body: {
    playerActionCardId: string
    category?: string
    targetPlayerId?: string
  },
) {
  return toResult(
    apiFetch(`/api/rooms/${roomId}/actions/play`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  )
}

export async function beginPresentationRequest(roomId: string) {
  return toResult(apiFetch(`/api/rooms/${roomId}/presentation`, { method: 'POST' }))
}

/** @deprecated use beginPresentationRequest */
export async function advanceToDiscussionRequest(roomId: string) {
  return beginPresentationRequest(roomId)
}

export async function advancePresentationRequest(roomId: string) {
  return toResult(apiFetch(`/api/rooms/${roomId}/presentation/advance`, { method: 'POST' }))
}

export async function pauseGameRequest(roomId: string) {
  return toResult(apiFetch(`/api/rooms/${roomId}/pause`, { method: 'POST' }))
}

export async function resumeGameRequest(roomId: string) {
  return toResult(apiFetch(`/api/rooms/${roomId}/resume`, { method: 'POST' }))
}

export async function startVotingRequest(roomId: string) {
  return toResult(apiFetch(`/api/rooms/${roomId}/voting/start`, { method: 'POST' }))
}

export async function submitVoteRequest(roomId: string, targetPlayerId: string) {
  return toResult(
    apiFetch(`/api/rooms/${roomId}/voting/submit`, {
      method: 'POST',
      body: JSON.stringify({ targetPlayerId }),
    }),
  )
}

export async function completeVotingRequest(roomId: string) {
  return toResult(apiFetch(`/api/rooms/${roomId}/voting/complete`, { method: 'POST' }))
}

export async function nextRevealRoundRequest(roomId: string) {
  return toResult(apiFetch(`/api/rooms/${roomId}/next-round`, { method: 'POST' }))
}

export async function finishGameRequest(roomId: string) {
  return toResult(apiFetch(`/api/rooms/${roomId}/finish`, { method: 'POST' }))
}
