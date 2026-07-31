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

const EFFECT_LABEL: Record<string, string> = {
  swap_characteristic: 'Обмен',
  reroll_characteristic: 'Реролл',
  force_reveal: 'Раскрытие',
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

  if (myCards.length === 0) {
    return (
      <div className="pl-4 sm:pl-5">
        <p className="dossier-hand text-2xl text-stone-500">Спецкарт пока нет.</p>
      </div>
    )
  }

  return (
    <>
      <section>
        <header className="mb-3 border-b border-dashed border-stone-500/25 pb-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
            Карман спецкарт
          </p>
          <p className="dossier-hand mt-0.5 text-2xl text-[var(--nb-ink)] sm:text-3xl">
            {myCards.filter((c) => !c.is_used).length} в руке · {myCards.length} всего
          </p>
        </header>

        <ul className="flex flex-wrap justify-center gap-3 sm:justify-start sm:gap-4">
          {myCards.map((card, index) => {
            const effectLabel =
              EFFECT_LABEL[card.action_card.effect_type] ?? 'Спецкарта'
            return (
              <li
                key={card.id}
                className={cn(strikingId === card.id && 'bunker-action-strike')}
                style={{
                  transform: `rotate(${(index % 2 === 0 ? -1.5 : 1.5) + (index % 3) - 1}deg)`,
                }}
              >
                <article
                  className="action-ticket-card flex min-h-[14rem] flex-col px-3 py-3"
                  data-used={card.is_used ? '' : undefined}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="action-ticket-stamp">
                      {card.is_used ? 'сыграно' : effectLabel}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-500">
                      спец · {index + 1}
                    </span>
                  </div>
                  <h4 className="dossier-hand mt-2 text-2xl font-semibold leading-tight text-[var(--nb-ink)]">
                    {card.action_card.title}
                  </h4>
                  <p className="dossier-hand mt-1 flex-1 text-lg leading-snug text-[var(--nb-ink-soft)]">
                    {card.action_card.description}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-3 w-full"
                    variant={card.is_used ? 'secondary' : 'default'}
                    disabled={disabled || pending || card.is_used}
                    onClick={() => openCard(card.id)}
                  >
                    {card.is_used ? 'Использована' : 'Играть'}
                  </Button>
                </article>
              </li>
            )
          })}
        </ul>
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
                  items={Object.fromEntries(
                    CHARACTERISTIC_CATEGORIES.map((cat) => {
                      const mine = myCharacteristics.find((c) => c.category === cat)
                      const label = CATEGORY_LABELS[cat as CharacteristicCategory]
                      return [cat, mine ? `${label} · ${mine.characteristic.title}` : label]
                    }),
                  )}
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
                  items={Object.fromEntries(targets.map((p) => [p.id, p.name]))}
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
              {pending ? 'Активация…' : 'Подтвердить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
