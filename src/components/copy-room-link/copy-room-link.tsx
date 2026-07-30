'use client'

import { useState } from 'react'
import { Check, Copy, Link2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { formatRoomCode } from '@/features/game/utils/game-logic'

interface CopyRoomLinkProps {
  code: string
  showQr?: boolean
  compact?: boolean
}

export function CopyRoomLink({ code, showQr = true, compact = false }: CopyRoomLinkProps) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const link = `${origin}/join?code=${code}`

  async function copy(value: string, kind: 'code' | 'link') {
    await navigator.clipboard.writeText(value)
    setCopied(kind)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className={`flex flex-col ${compact ? 'gap-2' : 'gap-4'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`font-mono font-semibold tracking-[0.18em] text-amber-200 ${
            compact ? 'text-lg' : 'text-2xl'
          }`}
        >
          {formatRoomCode(code)}
        </span>
        <Button type="button" variant="outline" size="sm" onClick={() => void copy(code, 'code')}>
          {copied === 'code' ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
          Код
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => void copy(link, 'link')}>
          {copied === 'link' ? <Check data-icon="inline-start" /> : <Link2 data-icon="inline-start" />}
          Ссылка
        </Button>
      </div>
      {showQr ? (
        <div className="w-fit rounded-md border border-border/40 bg-background/50 p-2">
          <QRCodeSVG
            value={link || `https://example.com/join?code=${code}`}
            size={compact ? 96 : 128}
            bgColor="transparent"
            fgColor="#e7e5e4"
          />
        </div>
      ) : null}
    </div>
  )
}
