'use client'

import { useEffect, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { API_URL, ensureBrowserAuth, getBrowserToken } from '@/lib/api/client'

interface UseRoomChannelOptions {
  roomCode: string
  enabled?: boolean
  onUpdate?: () => void
}

export function useRoomChannel({ roomCode, enabled = true, onUpdate }: UseRoomChannelOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)

  useEffect(() => {
    if (!enabled || !roomCode) return

    let socket: Socket | null = null
    let cancelled = false

    async function connect() {
      await ensureBrowserAuth()
      if (cancelled) return

      const next = io(API_URL, {
        auth: { token: getBrowserToken() },
        transports: ['websocket', 'polling'],
      })

      // Strict Mode can cancel between await and assignment — don't orphan the socket.
      if (cancelled) {
        next.disconnect()
        return
      }
      socket = next

      socket.on('connect', () => {
        setIsConnected(true)
        setIsReconnecting(false)
        socket?.emit('room:join', { code: roomCode })
      })

      socket.on('disconnect', () => {
        setIsConnected(false)
        setIsReconnecting(true)
      })

      socket.on('connect_error', () => {
        setIsConnected(false)
        setIsReconnecting(true)
      })

      socket.on('room:updated', () => {
        onUpdate?.()
      })
    }

    void connect()

    return () => {
      cancelled = true
      socket?.disconnect()
    }
  }, [enabled, onUpdate, roomCode])

  return { isConnected, isReconnecting }
}
