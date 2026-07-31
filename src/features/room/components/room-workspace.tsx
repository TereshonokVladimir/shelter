'use client'

import type { ReactNode } from 'react'

interface RoomWorkspaceProps {
  children: ReactNode
}

/** Full-height phase stage under the room header. */
export function RoomWorkspace({ children }: RoomWorkspaceProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden px-2.5 py-2 sm:px-4 sm:py-3 lg:px-5 xl:px-6">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col xl:max-w-[92rem]">
        {children}
      </div>
    </section>
  )
}
