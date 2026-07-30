'use client'

import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
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

/** Numeric control without native spinner — typed input + stacked steppers. */
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
    <div className={cn('flex items-center gap-2', className)}>
      <InputGroup className="w-28" data-disabled={disabled || undefined}>
        <InputGroupInput
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={String(value)}
          disabled={disabled}
          aria-invalid={ariaInvalid}
          className="text-center tabular-nums"
          onChange={(event) => {
            const raw = event.target.value.replace(/\D/g, '')
            if (raw === '') return
            onChange(clamp(Number(raw)))
          }}
          onBlur={() => onChange(clamp(value))}
        />
        <InputGroupAddon
          align="inline-end"
          className="h-full divide-y divide-border self-stretch border-l border-input p-0! pr-0! flex-col gap-0 has-[>button]:mr-0"
        >
          <InputGroupButton
            size="icon-xs"
            className="h-auto min-h-0 w-7 flex-1 basis-0 rounded-none rounded-tr-[calc(var(--radius)-1px)]"
            disabled={disabled || value >= max}
            onClick={() => bump(step)}
            aria-label="Увеличить"
          >
            <ChevronUpIcon className="size-3" />
          </InputGroupButton>
          <InputGroupButton
            size="icon-xs"
            className="h-auto min-h-0 w-7 flex-1 basis-0 rounded-none rounded-br-[calc(var(--radius)-1px)]"
            disabled={disabled || value <= min}
            onClick={() => bump(-step)}
            aria-label="Уменьшить"
          >
            <ChevronDownIcon className="size-3" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {suffix ? <InputGroupText className="px-0">{suffix}</InputGroupText> : null}
    </div>
  )
}
