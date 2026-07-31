'use client'

import type { ReactNode } from 'react'
import { CircleHelp } from 'lucide-react'
import { FieldLabel } from '@/components/ui/field'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface LabelWithHintProps {
  htmlFor?: string
  label: string
  hint: string
  limits?: string
  className?: string
}

/**
 * Form label + bunker tooltip (explanation + optional limits line).
 */
export function LabelWithHint({
  htmlFor,
  label,
  hint,
  limits,
  className,
}: LabelWithHintProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <FieldLabel htmlFor={htmlFor} className="mb-0">
        {label}
      </FieldLabel>
      <Tooltip>
        <TooltipTrigger
          type="button"
          className="inline-flex size-5 shrink-0 items-center justify-center rounded-sm text-stone-500 outline-none transition hover:text-amber-300 focus-visible:ring-2 focus-visible:ring-amber-500/50"
          aria-label={`Подсказка: ${label}`}
        >
          <CircleHelp className="size-3.5" aria-hidden />
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="start"
          className="max-w-[17.5rem] normal-case tracking-normal"
        >
          <span className="bunker-hint-kicker">{label}</span>
          <p className="text-[12px] font-medium leading-snug tracking-normal text-stone-100">
            {hint}
          </p>
          {limits ? (
            <p className="mt-1 font-mono text-[10px] font-normal uppercase tracking-[0.12em] text-amber-200/80">
              {limits}
            </p>
          ) : null}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

interface SectionHintProps {
  label: string
  hint: string
  limits?: string
  trailing?: ReactNode
}

/** Section title row with optional trailing meta (e.g. plan preview). */
export function SectionHint({ label, hint, limits, trailing }: SectionHintProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <LabelWithHint label={label} hint={hint} limits={limits} />
      {trailing}
    </div>
  )
}
