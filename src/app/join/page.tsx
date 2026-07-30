import Link from 'next/link'
import { JoinRoomForm } from '@/features/room/components/join-room-form'
import { APP_NAME } from '@/lib/constants'

interface JoinPageProps {
  searchParams: Promise<{ code?: string }>
}

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const params = await searchParams

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-6 px-4 py-10">
      <div>
        <Link href="/" className="text-xs uppercase tracking-[0.3em] text-amber-200/70">
          {APP_NAME}
        </Link>
        <h1 className="mt-2 text-3xl text-stone-50">Войти в комнату</h1>
      </div>
      <JoinRoomForm initialCode={params.code ?? ''} />
    </main>
  )
}
