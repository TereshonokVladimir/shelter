import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'
import { TypingText } from '@/components/typography/typing-text'

interface PhaseShellProps {
  title: string
  subtitle?: string
  step?: string
  badge?: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
  /** Wider content for dense grids (voting, results) */
  wide?: boolean
}

/**
 * One bunker frame for the active phase.
 * The whole panel scrolls together — header and footer included.
 */
export function PhaseShell({
  title,
  subtitle,
  step,
  badge,
  children,
  footer,
  className,
  wide = false,
}: PhaseShellProps) {
  return (
    <div className={cn('bunker-phase-enter flex h-full min-h-0 w-full flex-col', className)}>
      <article className="bunker-panel scrollbar-thin relative flex h-full min-h-0 flex-1 flex-col overscroll-contain">
        <div className="bunker-hazard-stripe h-1.5 shrink-0" aria-hidden />

        <header className="shrink-0 border-b border-amber-900/30 px-3 py-2.5 sm:px-4 sm:py-3">
          <span className="bunker-corner bunker-corner-tl scale-75" aria-hidden />
          <span className="bunker-corner bunker-corner-tr scale-75" aria-hidden />
          <div className="relative z-[1] flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="bunker-label text-neon-cyan mb-1">Операция · бункер</p>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <h2
                  className="text-glitch font-[family-name:var(--font-display)] text-xl tracking-wide text-stone-50 sm:text-2xl"
                  data-text={title}
                >
                  {title}
                </h2>
                {subtitle ? (
                  <p className="line-clamp-1 text-xs text-stone-400 sm:text-sm">{subtitle}</p>
                ) : null}
              </div>
              {step ? (
                <p className="mt-1.5 line-clamp-2 border-l-2 border-cyan-400/40 pl-2.5 text-sm font-medium text-amber-100/90">
                  <TypingText text={step} className="font-sans text-sm font-medium text-amber-100/90" speed={16} delay={80} />
                </p>
              ) : null}
            </div>
            {badge ? <div className="shrink-0">{badge}</div> : null}
          </div>
        </header>

        <div
          className={cn(
            'relative z-[1] w-full px-3 pt-3 sm:px-4 sm:pt-4',
            footer ? 'pb-6 sm:pb-8' : 'pb-3 sm:pb-4',
            wide ? 'flex flex-col xl:px-5' : 'mx-auto max-w-4xl',
          )}
        >
          {children}
        </div>

        {footer ? (
          <footer className="mt-auto shrink-0 border-t border-amber-900/35">
            <div className="bunker-hazard-stripe-soft h-1 opacity-80" aria-hidden />
            <div className="px-3 py-2.5 sm:px-4 sm:py-3">{footer}</div>
          </footer>
        ) : null}
      </article>
    </div>
  )
}
