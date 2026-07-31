import Link from 'next/link'
import { CreateRoomForm } from '@/features/room/components/create-room-form'
import { APP_NAME } from '@/lib/constants'

export default function CreatePage() {
  return (
    <main className="bunker-atmosphere relative min-h-screen overflow-hidden">
      <div className="bunker-dust" aria-hidden />
      <div className="bunker-crop" aria-hidden />
      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-8 sm:max-w-3xl sm:py-10 md:px-6">
        <div>
          <Link href="/" className="bunker-label hover:text-amber-200">
            {APP_NAME}
          </Link>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-wide text-stone-50">
            Новая комната
          </h1>
        </div>
        <CreateRoomForm />
        <p className="text-center text-xs text-stone-600">
          <Link href="/admin" className="hover:text-stone-400">
            Админка контента
          </Link>
        </p>
      </div>
    </main>
  )
}
