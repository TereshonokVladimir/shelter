'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface TypingTextProps {
  text: string
  className?: string
  /** ms per character */
  speed?: number
  /** delay before start */
  delay?: number
  as?: 'span' | 'p' | 'h1' | 'h2'
}

/** Terminal-style letter-by-letter reveal. Respects reduced motion. */
export function TypingText({
  text,
  className,
  speed = 28,
  delay = 120,
  as: Tag = 'span',
}: TypingTextProps) {
  const [shown, setShown] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setShown(text)
      setDone(true)
      return
    }

    setShown('')
    setDone(false)
    let i = 0
    let intervalId: number | undefined
    const timeoutId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        i += 1
        setShown(text.slice(0, i))
        if (i >= text.length) {
          window.clearInterval(intervalId)
          setDone(true)
        }
      }, speed)
    }, delay)

    return () => {
      window.clearTimeout(timeoutId)
      if (intervalId) window.clearInterval(intervalId)
    }
  }, [text, speed, delay])

  return (
    <Tag className={cn('font-mono', className)} aria-label={text}>
      <span aria-hidden>{shown}</span>
      <span
        className={cn(
          'ml-0.5 inline-block w-[0.55ch] translate-y-px bg-current align-baseline',
          done ? 'animate-pulse opacity-40' : 'opacity-90',
        )}
        style={{ height: '1em' }}
        aria-hidden
      />
    </Tag>
  )
}
