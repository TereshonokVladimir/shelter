import Link from 'next/link'
import { CreateRoomForm } from '@/features/room/components/create-room-form'
import { APP_NAME } from '@/lib/constants'

export default function CreatePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-6 px-4 py-10">
      <div>
        <Link href="/" className="text-xs uppercase tracking-[0.3em] text-amber-200/70">
          {APP_NAME}
        </Link>
        <h1 className="mt-2 text-3xl text-stone-50">Новая комната</h1>
      </div>
      <CreateRoomForm />
      <p className="text-center text-xs text-stone-600">
        <Link href="/admin" className="hover:text-stone-400">
          Админка контента
        </Link>
      </p>
    </main>
  )
}
