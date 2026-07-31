'use client'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { NotebookProfile } from '@/features/game/components/notebook-profile'
import type { Player, PlayerCharacteristicView } from '@/lib/api/types'

interface DossierSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  player: Player | null
  characteristics: PlayerCharacteristicView[]
}

/** Right sheet with one player's revealed dossier. */
export function DossierSheet({
  open,
  onOpenChange,
  player,
  characteristics,
}: DossierSheetProps) {
  const chars = player
    ? characteristics.filter((c) => c.player_id === player.id)
    : []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="dossier-paper-sheet gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-dashed border-stone-600/25 py-3 pr-12 pl-8 sm:pl-10">
          <SheetTitle className="text-[var(--nb-ink)]">
            {player ? `Досье · ${player.name}` : 'Досье'}
          </SheetTitle>
          <SheetDescription className="text-stone-600">
            Только раскрытые факты.
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto py-4 pr-4 pl-8 sm:pl-10">
          {player ? (
            <NotebookProfile
              player={player}
              characteristics={chars}
              revealedOnly
              compact
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
