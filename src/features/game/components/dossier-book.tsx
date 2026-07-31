'use client'

import { useRef, useState, type ReactNode } from 'react'
import { BookOpen, Columns2, Sparkles, UserRound } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlayersCompare } from '@/features/game/components/players-compare'
import { cn } from '@/lib/utils'
import type { Player, PlayerCharacteristicView } from '@/lib/api/types'

export type DossierBookPage = 'mine' | 'actions' | 'others' | 'compare'

interface DossierBookProps {
  mine: ReactNode
  actions?: ReactNode
  hasActions?: boolean
  preface?: ReactNode
  others: Player[]
  characteristics: PlayerCharacteristicView[]
  focusPlayerId?: string | null
  page?: DossierBookPage
  onPageChange?: (page: DossierBookPage) => void
  defaultPage?: DossierBookPage
  className?: string
}

const TAB_CLASS =
  'dossier-notebook-tab min-w-0 flex-1 gap-1 after:hidden data-active:bg-[var(--nb-paper)] data-active:text-[var(--nb-ink)] data-active:shadow-none'

const PAGE_PAD = 'relative z-[1] p-3 sm:p-10 xl:p-12'

const PANEL_CLASS = 'dossier-notebook-page m-0 flex-none outline-none'

function findScrollParent(node: HTMLElement | null): HTMLElement | null {
  let current = node?.parentElement ?? null
  while (current) {
    const { overflowY } = getComputedStyle(current)
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
      return current
    }
    current = current.parentElement
  }
  return null
}

export function DossierBook({
  mine,
  actions,
  hasActions = Boolean(actions),
  preface,
  others,
  characteristics,
  focusPlayerId = null,
  page: pageProp,
  onPageChange,
  defaultPage = 'mine',
  className,
}: DossierBookProps) {
  const [uncontrolledPage, setUncontrolledPage] = useState<DossierBookPage>(defaultPage)
  const page = pageProp ?? uncontrolledPage
  const hasOthers = others.length > 0
  const rootRef = useRef<HTMLDivElement>(null)

  function setPage(next: DossierBookPage) {
    if (pageProp == null) setUncontrolledPage(next)
    onPageChange?.(next)
  }

  function onTabChange(value: string | null) {
    if (
      value !== 'mine' &&
      value !== 'actions' &&
      value !== 'others' &&
      value !== 'compare'
    ) {
      return
    }

    const scroller = findScrollParent(rootRef.current)
    const y = scroller?.scrollTop ?? 0

    setPage(value)

    // Keep outer phase scroll put after layout / focus settles
    const pin = () => {
      if (scroller) scroller.scrollTop = y
    }
    requestAnimationFrame(() => {
      pin()
      requestAnimationFrame(pin)
    })
    window.setTimeout(pin, 0)
    window.setTimeout(pin, 50)
  }

  return (
    <div ref={rootRef} className={cn('dossier-book flex w-full flex-col gap-3', className)}>
      {preface ? <div className="shrink-0">{preface}</div> : null}

      <Tabs
        value={page}
        onValueChange={onTabChange}
        className="dossier-notebook flex w-full flex-col gap-0"
      >
        <div className="dossier-notebook-head shrink-0">
          <div className="dossier-notebook-brand">
            <p className="dossier-notebook-brand-title">Записная книжка</p>
            <p className="dossier-notebook-brand-meta">досье · бункер</p>
          </div>
          <TabsList
            variant="line"
            className="dossier-notebook-tabs h-auto w-full justify-stretch gap-0 rounded-none bg-transparent p-0"
          >
            <TabsTrigger value="mine" className={TAB_CLASS}>
              <UserRound className="size-3.5 opacity-70" aria-hidden />
              Профиль
            </TabsTrigger>
            {hasActions ? (
              <TabsTrigger value="actions" className={TAB_CLASS}>
                <Sparkles className="size-3.5 opacity-70" aria-hidden />
                Спецкарты
              </TabsTrigger>
            ) : null}
            {hasOthers ? (
              <TabsTrigger value="others" className={TAB_CLASS}>
                <BookOpen className="size-3.5 opacity-70" aria-hidden />
                Игроки
              </TabsTrigger>
            ) : null}
            {hasOthers ? (
              <TabsTrigger value="compare" className={TAB_CLASS}>
                <Columns2 className="size-3.5 opacity-70" aria-hidden />
                Сравнить
              </TabsTrigger>
            ) : null}
          </TabsList>
        </div>

        <TabsContent keepMounted value="mine" className={PANEL_CLASS}>
          <div className={PAGE_PAD}>{mine}</div>
        </TabsContent>

        {hasActions ? (
          <TabsContent keepMounted value="actions" className={PANEL_CLASS}>
            <div className={PAGE_PAD}>{actions}</div>
          </TabsContent>
        ) : null}

        {hasOthers ? (
          <TabsContent keepMounted value="others" className={PANEL_CLASS}>
            <div className={cn(PAGE_PAD, 'flex flex-col gap-3')}>
              <p className="dossier-hand text-lg text-stone-600">
                Листайте вбок или выберите имя — только открытые факты.
              </p>
              <PlayersCompare
                players={others}
                characteristics={characteristics}
                revealedOnly
                emptyLabel="Ещё ничего не раскрыто"
                focusPlayerId={focusPlayerId}
                lockedMode="browse"
                active={page === 'others'}
              />
            </div>
          </TabsContent>
        ) : null}

        {hasOthers ? (
          <TabsContent keepMounted value="compare" className={PANEL_CLASS}>
            <div className={cn(PAGE_PAD, 'flex flex-col gap-3')}>
              <PlayersCompare
                players={others}
                characteristics={characteristics}
                revealedOnly
                emptyLabel="Ещё ничего не раскрыто"
                lockedMode="compare"
                active={page === 'compare'}
              />
            </div>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  )
}
