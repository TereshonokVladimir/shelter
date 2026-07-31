import Link from 'next/link'
import { JoinRoomForm } from '@/features/room/components/join-room-form'
import { TypingText } from '@/components/typography/typing-text'
import { buttonVariants } from '@/components/ui/button'
import { APP_NAME } from '@/lib/constants'
import { cn } from '@/lib/utils'

export default function HomePage() {
  return (
    <main className="bunker-atmosphere relative min-h-screen overflow-hidden">
      <div className="bunker-dust" aria-hidden />
      <div className="bunker-crop" aria-hidden />
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-16 md:py-24">
        <section className="bunker-phase-enter relative flex max-w-2xl flex-col gap-5">
          <span className="bunker-stamp absolute -right-2 top-0 sm:right-8" aria-hidden>
            секретный протокол
          </span>
          <p className="bunker-label text-neon-cyan">Онлайн · убежище · голосование</p>
          <h1
            className="text-glitch font-[family-name:var(--font-display)] text-5xl leading-[0.95] text-stone-50 md:text-7xl"
            data-text={APP_NAME}
          >
            {APP_NAME}
          </h1>
          <TypingText
            as="p"
            text="Катастрофа уже здесь. Мест в убежище меньше, чем игроков. Раскрывайте факты, спорьте и решайте голосованием, кто останется под защитой."
            speed={12}
            delay={400}
            className="max-w-xl font-sans text-base text-stone-300 md:text-lg"
          />
          <div className="flex flex-wrap gap-3">
            <Link href="/create" className={cn(buttonVariants({ size: 'lg' }), 'px-5')}>
              Создать комнату
            </Link>
            <Link
              href="/join"
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'px-5')}
            >
              Войти по коду
            </Link>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <div className="bunker-panel overflow-hidden rounded-2xl">
            <div className="bunker-hazard-stripe h-2" />
            <div className="relative z-[1] p-6">
              <p className="bunker-label mb-2">Инструкция</p>
              <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg tracking-wide text-stone-100">
                Как выжить
              </h2>
              <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-stone-300">
                <li>Ведущий создаёт комнату и делится кодом.</li>
                <li>Игроки входят без регистрации и ждут старта.</li>
                <li>Система выдаёт катастрофу, убежище и персонажей.</li>
                <li>По раундам раскрываются характеристики и спецкарты.</li>
                <li>Речи по очереди, затем голосование исключает одного.</li>
                <li>Игра длится, пока не останется столько людей, сколько мест в убежище.</li>
              </ol>
            </div>
          </div>
          <div className="bunker-panel overflow-hidden rounded-2xl">
            <div className="bunker-hazard-stripe h-2" />
            <div className="relative z-[1] p-6">
              <p className="bunker-label mb-2">Быстрый доступ</p>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg tracking-wide text-stone-100">
                Быстрый вход
              </h2>
              <JoinRoomForm compact />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
