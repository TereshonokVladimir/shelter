'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function RoomError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-4 px-4 py-16">
      <h1 className="text-2xl text-stone-50">Ошибка комнаты</h1>
      <p className="text-sm text-stone-400">{error.message || 'Что-то пошло не так.'}</p>
      <div className="flex gap-2">
        <button type="button" className={cn(buttonVariants())} onClick={reset}>
          Повторить
        </button>
        <Link href="/" className={cn(buttonVariants({ variant: 'outline' }))}>
          На главную
        </Link>
      </div>
    </main>
  )
}
