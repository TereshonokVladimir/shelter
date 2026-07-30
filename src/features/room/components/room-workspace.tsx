'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, PanelLeft, PanelRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { usePanelRef } from 'react-resizable-panels'
import { cn } from '@/lib/utils'

const LAYOUT_KEY = 'ls-room-layout-v1'

type LayoutMap = Record<string, number>

function readLayout(): LayoutMap | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const raw = localStorage.getItem(LAYOUT_KEY)
    if (!raw) return undefined
    return JSON.parse(raw) as LayoutMap
  } catch {
    return undefined
  }
}

function RailChrome({
  side,
  title,
  collapsed,
  onToggle,
  children,
}: {
  side: 'left' | 'right'
  title: string
  collapsed: boolean
  onToggle: () => void
  children: ReactNode
}) {
  if (collapsed) {
    return (
      <div className="flex h-full flex-col items-center bg-stone-900/70 py-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title={`Показать: ${title}`}
          aria-label={`Показать панель «${title}»`}
          onClick={onToggle}
        >
          {side === 'left' ? <PanelLeft /> : <PanelRight />}
        </Button>
        <span
          className="mt-3 max-h-40 truncate text-[10px] uppercase tracking-[0.2em] text-stone-500"
          style={{ writingMode: 'vertical-rl' }}
        >
          {title}
        </span>
      </div>
    )
  }

  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className={cn(
          'absolute top-2 z-20 bg-stone-950/80',
          side === 'left' ? 'right-2' : 'left-2',
        )}
        title={`Скрыть: ${title}`}
        aria-label={`Скрыть панель «${title}»`}
        onClick={onToggle}
      >
        {side === 'left' ? <ChevronLeft /> : <ChevronRight />}
      </Button>
      {children}
    </div>
  )
}

interface RoomWorkspaceProps {
  left: ReactNode
  center: ReactNode
  right: ReactNode
  mobileTop?: ReactNode
}

export function RoomWorkspace({ left, center, right, mobileTop }: RoomWorkspaceProps) {
  const leftPanelRef = usePanelRef()
  const rightPanelRef = usePanelRef()
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  const [defaultLayout, setDefaultLayout] = useState<LayoutMap | undefined>()

  useEffect(() => {
    setDefaultLayout(readLayout())
  }, [])

  function toggleLeft() {
    const panel = leftPanelRef.current
    if (!panel) return
    if (panel.isCollapsed()) {
      panel.expand()
      setLeftCollapsed(false)
    } else {
      panel.collapse()
      setLeftCollapsed(true)
    }
  }

  function toggleRight() {
    const panel = rightPanelRef.current
    if (!panel) return
    if (panel.isCollapsed()) {
      panel.expand()
      setRightCollapsed(false)
    } else {
      panel.collapse()
      setRightCollapsed(true)
    }
  }

  return (
    <>
      {/* Mobile / tablet: no side rails */}
      <div className="flex min-h-0 flex-1 flex-col lg:hidden">
        <section className="scrollbar-none min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {mobileTop}
          {center}
        </section>
      </div>

      {/* Desktop: shadcn Resizable panels */}
      <div className="room-resizable hidden min-h-0 flex-1 lg:block">
        <ResizablePanelGroup
          orientation="horizontal"
          className="h-full"
          defaultLayout={defaultLayout}
          onLayoutChanged={(layout) => {
            localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout))
            setLeftCollapsed(Boolean(leftPanelRef.current?.isCollapsed()))
            setRightCollapsed(Boolean(rightPanelRef.current?.isCollapsed()))
          }}
        >
          <ResizablePanel
            id="players"
            panelRef={leftPanelRef}
            collapsible
            collapsedSize={48}
            minSize={180}
            maxSize={420}
            defaultSize={256}
            className="min-h-0"
            onResize={(_size, _id, prev) => {
              if (prev == null) return
              setLeftCollapsed(Boolean(leftPanelRef.current?.isCollapsed()))
            }}
          >
            <RailChrome
              side="left"
              title="Игроки"
              collapsed={leftCollapsed}
              onToggle={toggleLeft}
            >
              {left}
            </RailChrome>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-border/60" />

          <ResizablePanel id="main" minSize="30%" defaultSize="50%" className="min-h-0">
            <section className="scrollbar-none h-full min-h-0 overflow-y-auto px-6 py-5 lg:px-8">
              <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col">{center}</div>
            </section>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-border/60" />

          <ResizablePanel
            id="context"
            panelRef={rightPanelRef}
            collapsible
            collapsedSize={48}
            minSize={200}
            maxSize={440}
            defaultSize={300}
            className="min-h-0"
            onResize={(_size, _id, prev) => {
              if (prev == null) return
              setRightCollapsed(Boolean(rightPanelRef.current?.isCollapsed()))
            }}
          >
            <RailChrome
              side="right"
              title="Контекст"
              collapsed={rightCollapsed}
              onToggle={toggleRight}
            >
              {right}
            </RailChrome>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  )
}
