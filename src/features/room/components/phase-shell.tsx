import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface PhaseShellProps {
  title: string
  subtitle?: string
  step?: string
  badge?: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
}

/** Shared room-phase frame: clear title, “what to do now”, sticky primary actions. */
export function PhaseShell({
  title,
  subtitle,
  step,
  badge,
  children,
  footer,
  className,
}: PhaseShellProps) {
  return (
    <div className={cn('bunker-phase-enter flex h-full min-h-0 flex-col gap-4', className)}>
      <header className="relative flex shrink-0 flex-wrap items-start justify-between gap-3 overflow-hidden rounded-xl border border-amber-900/30 bg-stone-950/40 px-4 py-3 sm:px-5">
        <span className="bunker-corner bunker-corner-tl" aria-hidden />
        <span className="bunker-corner bunker-corner-tr" aria-hidden />
        <span className="bunker-corner bunker-corner-bl" aria-hidden />
        <span className="bunker-corner bunker-corner-br" aria-hidden />
        <div className="relative z-[1] min-w-0 max-w-2xl">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.28em] text-amber-500/80">
            Операция · бункер
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-stone-50 sm:text-3xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1.5 text-sm leading-relaxed text-stone-400">{subtitle}</p>
          ) : null}
        </div>
        {badge ? <div className="relative z-[1] shrink-0">{badge}</div> : null}
      </header>

      {step ? (
        <div className="bunker-hazard-stripe relative shrink-0 overflow-hidden rounded-xl border border-amber-600/40 px-4 py-3 shadow-[inset_0_1px_0_rgba(251,191,36,0.12)]">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-amber-200/80">
            Задание фазы
          </p>
          <p className="mt-1 text-sm font-medium text-amber-50">{step}</p>
        </div>
      ) : null}

      <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto">{children}</div>

      {footer ? (
        <footer className="shrink-0 border-t border-amber-900/30 bg-stone-950/85 pt-4 backdrop-blur-sm">
          {footer}
        </footer>
      ) : null}
    </div>
  )
}
