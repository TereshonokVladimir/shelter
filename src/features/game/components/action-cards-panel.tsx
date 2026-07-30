'use client'

import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { playActionCardRequest } from '@/features/room/actions/api-commands'
import { CATEGORY_LABELS, CHARACTERISTIC_CATEGORIES } from '@/lib/constants'
import type {
  CharacteristicCategory,
  Player,
  PlayerActionCardView,
  PlayerCharacteristicView,
} from '@/lib/api/types'
import { cn } from '@/lib/utils'

interface ActionCardsPanelProps {
  roomId: string
  meId: string
  players: Player[]
  myCharacteristics: PlayerCharacteristicView[]
  actionCards: PlayerActionCardView[]
  disabled?: boolean
  onChanged?: () => void
}

export function ActionCardsPanel({
  roomId,
  meId,
  players,
  myCharacteristics,
  actionCards,
  disabled = false,
  onChanged,
}: ActionCardsPanelProps) {
  const [pending, startTransition] = useTransition()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [category, setCategory] = useState<string | null>(null)
  const [targetPlayerId, setTargetPlayerId] = useState<string | null>(null)
  const [strikingId, setStrikingId] = useState<string | null>(null)

  const myCards = useMemo(
    () => actionCards.filter((c) => c.player_id === meId),
    [actionCards, meId],
  )
  const active = myCards.find((c) => c.id === activeId) ?? null
  const effect = active?.action_card.effect_type
  const needsCategory =
    effect === 'swap_characteristic' || effect === 'reroll_characteristic'
  const needsTarget = effect === 'swap_characteristic' || effect === 'force_reveal'

  const targets = players.filter((p) => p.id !== meId && p.status === 'active')

  function openCard(id: string) {
    setActiveId(id)
    setCategory(null)
    setTargetPlayerId(null)
  }

  function close() {
    setActiveId(null)
    setCategory(null)
    setTargetPlayerId(null)
  }

  function canSubmit() {
    if (!active || active.is_used) return false
    if (needsCategory && !category) return false
    if (needsTarget && !targetPlayerId) return false
    return true
  }

  function submit() {
    if (!active || !canSubmit()) return
    const cardId = active.id
    const title = active.action_card.title
    const payload = {
      playerActionCardId: cardId,
      category: category ?? undefined,
      targetPlayerId: targetPlayerId ?? undefined,
    }
    close()
    setStrikingId(cardId)
    startTransition(async () => {
      await new Promise((r) => setTimeout(r, 420))
      const result = await playActionCardRequest(roomId, payload)
      setStrikingId(null)
      if (!result.ok) {
        toast.error(result.error ?? 'Не удалось сыграть карту')
        return
      }
      toast.success(`Сыграно: ${title}`)
      onChanged?.()
    })
  }

  if (myCards.length === 0) return null

  return (
    <>
      <section className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-amber-500/80">
            Спецкарта
          </h3>
          <p className="text-[11px] text-stone-500">одноразовая · не из досье</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {myCards.map((card) => (
            <article
              key={card.id}
              className={cn(
                'relative overflow-hidden rounded-xl border border-orange-700/45 bg-gradient-to-br from-orange-950/55 via-stone-950/80 to-stone-950 p-4 shadow-[inset_0_1px_0_rgba(251,146,60,0.12)]',
                card.is_used && 'opacity-50 saturate-50',
                strikingId === card.id && 'bunker-action-strike',
              )}
            >
              <div className="bunker-hazard-stripe absolute inset-x-0 top-0 h-1.5 opacity-80" />
              <span className="bunker-rivet left-2 top-3" aria-hidden />
              <span className="bunker-rivet right-2 top-3" aria-hidden />
              <div className="mt-2 flex items-start justify-between gap-2">
                <h4 className="font-[family-name:var(--font-display)] text-lg tracking-wide text-orange-50">
                  {card.action_card.title}
                </h4>
                <span className="shrink-0 rounded-md border border-orange-700/50 bg-orange-950/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-orange-200/80">
                  {card.is_used ? 'spent' : 'ready'}
                </span>
              </div>
              <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-orange-200/55">
                {card.is_used
                  ? `Использовано${card.used_round != null ? ` · раунд ${card.used_round}` : ''}`
                  : 'Играть в фазе раскрытия / речи'}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-stone-300">
                {card.action_card.description}
              </p>
              <Button
                type="button"
                className="mt-4 w-full"
                variant={card.is_used ? 'secondary' : 'default'}
                disabled={disabled || pending || card.is_used}
                onClick={() => openCard(card.id)}
              >
                {card.is_used ? 'Сыграно' : 'Активировать'}
              </Button>
            </article>
          ))}
        </div>
      </section>

      <Dialog open={Boolean(active)} onOpenChange={(open) => !open && close()}>
        <DialogContent className="overflow-hidden border-orange-800/40 sm:max-w-md">
          <div className="bunker-hazard-stripe -mx-4 -mt-4 h-2" />
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-display)] tracking-wide">
              {active?.action_card.title}
            </DialogTitle>
            <DialogDescription>{active?.action_card.description}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {needsCategory ? (
              <Field>
                <FieldLabel>Категория</FieldLabel>
                <Select
                  value={category}
                  onValueChange={(value) => setCategory(value ?? null)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHARACTERISTIC_CATEGORIES.map((cat) => {
                      const mine = myCharacteristics.find((c) => c.category === cat)
                      return (
                        <SelectItem key={cat} value={cat}>
                          {CATEGORY_LABELS[cat as CharacteristicCategory]}
                          {mine ? ` · ${mine.characteristic.title}` : ''}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </Field>
            ) : null}

            {needsTarget ? (
              <Field>
                <FieldLabel>Игрок</FieldLabel>
                <Select
                  value={targetPlayerId}
                  onValueChange={(value) => setTargetPlayerId(value ?? null)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Выберите игрока" />
                  </SelectTrigger>
                  <SelectContent>
                    {targets.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={close} disabled={pending}>
              Отмена
            </Button>
            <Button type="button" onClick={submit} disabled={pending || !canSubmit()}>
              {pending ? 'Активация…' : 'Подтвердить удар'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
