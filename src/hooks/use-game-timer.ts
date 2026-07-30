'use client'

import { useEffect, useState } from 'react'
import { formatRemainingTime } from '@/features/game/utils/game-logic'

function secondsLeft(remainingMs: number) {
  return Math.max(0, Math.ceil(remainingMs / 1000))
}

export function useGameTimer(phaseEndsAt: string | null | undefined) {
  const endMs =
    phaseEndsAt == null || phaseEndsAt === ''
      ? null
      : Date.parse(phaseEndsAt)

  const [remainingMs, setRemainingMs] = useState(() =>
    endMs == null || Number.isNaN(endMs) ? 0 : Math.max(0, endMs - Date.now()),
  )

  useEffect(() => {
    if (endMs == null || Number.isNaN(endMs)) {
      setRemainingMs(0)
      return
    }

    let timeoutId: ReturnType<typeof setTimeout>

    const sync = () => {
      const left = Math.max(0, endMs - Date.now())
      setRemainingMs((prev) => (secondsLeft(prev) === secondsLeft(left) ? prev : left))

      if (left <= 0) return

      const delay = left % 1000 || 1000
      timeoutId = setTimeout(sync, delay)
    }

    sync()
    return () => clearTimeout(timeoutId)
  }, [endMs])

  return {
    remainingMs,
    isExpired: endMs != null && !Number.isNaN(endMs) && remainingMs <= 0,
    label: formatRemainingTime(remainingMs),
  }
}
