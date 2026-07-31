'use client'

import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { cn } from '@/lib/utils'

interface NumberStepperProps {
  id?: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  disabled?: boolean
  suffix?: string
  className?: string
  'aria-invalid'?: boolean
}

/** Numeric control: value + unit inside the field, steppers on the right. */
export function NumberStepper({
  id,
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled,
  suffix,
  className,
  'aria-invalid': ariaInvalid,
}: NumberStepperProps) {
  function clamp(next: number) {
    return Math.min(max, Math.max(min, next))
  }

  function bump(delta: number) {
    onChange(clamp(value + delta))
  }

  return (
    <InputGroup
      className={cn('w-full min-w-0', className)}
      data-disabled={disabled || undefined}
    >
      <InputGroupInput
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={String(value)}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        className="min-w-0 flex-1 pr-1 text-left tabular-nums"
        onChange={(event) => {
          const raw = event.target.value.replace(/\D/g, '')
          if (raw === '') return
          onChange(clamp(Number(raw)))
        }}
        onBlur={() => onChange(clamp(value))}
      />

      <InputGroupAddon
        align="inline-end"
        className="h-full gap-0 self-stretch border-l border-amber-900/40 p-0! has-[>button]:mr-0"
      >
        {suffix ? (
          <span className="flex h-full items-center px-2.5 text-xs font-medium tracking-wide text-stone-500 select-none">
            {suffix}
          </span>
        ) : null}
        <div className="flex h-full flex-col border-l border-amber-900/40">
          <InputGroupButton
            size="icon-xs"
            className="h-auto min-h-0 w-7 flex-1 basis-0 rounded-none rounded-tr-[calc(var(--radius)-1px)] text-amber-200/70 hover:bg-amber-950/40 hover:text-amber-100"
            disabled={disabled || value >= max}
            onClick={() => bump(step)}
            aria-label="Увеличить"
          >
            <ChevronUpIcon className="size-3" />
          </InputGroupButton>
          <InputGroupButton
            size="icon-xs"
            className="h-auto min-h-0 w-7 flex-1 basis-0 rounded-none rounded-br-[calc(var(--radius)-1px)] text-amber-200/70 hover:bg-amber-950/40 hover:text-amber-100"
            disabled={disabled || value <= min}
            onClick={() => bump(-step)}
            aria-label="Уменьшить"
          >
            <ChevronDownIcon className="size-3" />
          </InputGroupButton>
        </div>
      </InputGroupAddon>
    </InputGroup>
  )
}
