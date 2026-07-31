import Link from 'next/link'
import { JoinRoomForm } from '@/features/room/components/join-room-form'
import { APP_NAME } from '@/lib/constants'

interface JoinPageProps {
  searchParams: Promise<{ code?: string }>
}

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const params = await searchParams

  return (
    <main className="bunker-atmosphere relative min-h-screen overflow-hidden">
      <div className="bunker-dust" aria-hidden />
      <div className="bunker-crop" aria-hidden />
      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-10">
        <div>
          <Link href="/" className="bunker-label hover:text-amber-200">
            {APP_NAME}
          </Link>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-wide text-stone-50">
            Войти в комнату
          </h1>
        </div>
        <JoinRoomForm initialCode={params.code ?? ''} />
      </div>
    </main>
  )
}
