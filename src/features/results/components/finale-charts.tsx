'use client'

import { useId } from 'react'
import { cn } from '@/lib/utils'

/**
 * Single cyberpunk HUD radial: team readiness vs disaster threshold.
 * Fill arc intentionally overshoots the threshold tick slightly so the round
 * cap reads “past the line”, not jammed against it.
 */
export function CyberRadialGauge({
  outlook,
  threshold,
  passed,
  className,
}: {
  outlook: number
  threshold: number
  passed: boolean
  className?: string
}) {
  const uid = useId()
  const size = 240
  const cx = size / 2
  const cy = size / 2
  const r = 86
  const stroke = 12
  const startAngle = -210
  const sweep = 240

  const circ = 2 * Math.PI * r
  const arcLen = (sweep / 360) * circ

  // Overshoot so round cap clears the threshold tick (~1–2px visual)
  const fillPct = Math.min(100, Math.max(0, outlook))
  const overshoot = outlook >= threshold - 0.5 ? 1.2 : 0
  const fillLen = Math.min(arcLen, (fillPct / 100) * arcLen + overshoot)

  const threshPct = Math.min(100, Math.max(0, threshold))
  const threshAngle = startAngle + (threshPct / 100) * sweep

  function polar(angleDeg: number, radius: number) {
    const rad = (angleDeg * Math.PI) / 180
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    }
  }

  const ticks = Array.from({ length: 13 }, (_, i) => {
    const t = i / 12
    const a = startAngle + t * sweep
    const outer = polar(a, r + 10)
    const inner = polar(a, r + (i % 3 === 0 ? 4 : 7))
    return { outer, inner, major: i % 3 === 0 }
  })

  const threshOuter = polar(threshAngle, r + 16)
  const threshInner = polar(threshAngle, r - 4)
  const accent = passed ? '#34d399' : '#fb7185'
  const glowId = `${uid}-glow`
  const gradId = `${uid}-grad`

  return (
    <section
      className={cn(
        'cyber-radial relative overflow-hidden border border-cyan-500/25 bg-stone-950/80',
        className,
      )}
    >
      <span className="cyber-radial-corner cyber-radial-corner-tl" aria-hidden />
      <span className="cyber-radial-corner cyber-radial-corner-tr" aria-hidden />
      <span className="cyber-radial-corner cyber-radial-corner-bl" aria-hidden />
      <span className="cyber-radial-corner cyber-radial-corner-br" aria-hidden />
      <div className="cyber-radial-scan" aria-hidden />

      <div className="relative z-[1] flex flex-col items-center px-4 pb-5 pt-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300/70">
          // readiness.link
        </p>

        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="mt-1 h-auto w-full max-w-[17rem] drop-shadow-[0_0_18px_rgba(34,211,238,0.18)]"
          role="img"
          aria-label={`Готовность ${outlook} процентов, порог ${threshold}`}
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={passed ? '#065f46' : '#881337'} />
              <stop offset="55%" stopColor={accent} />
              <stop offset="100%" stopColor={passed ? '#a7f3d0' : '#fecdd3'} />
            </linearGradient>
            <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ghost track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(148,163,184,0.14)"
            strokeWidth={stroke}
            strokeDasharray={`${arcLen} ${circ}`}
            strokeDashoffset={0}
            strokeLinecap="butt"
            transform={`rotate(${startAngle} ${cx} ${cy})`}
          />

          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={stroke}
            strokeDasharray={`${fillLen} ${circ}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            filter={`url(#${glowId})`}
            transform={`rotate(${startAngle} ${cx} ${cy})`}
            className="cyber-radial-fill"
          />

          {/* ticks */}
          {ticks.map((t, i) => (
            <line
              key={i}
              x1={t.inner.x}
              y1={t.inner.y}
              x2={t.outer.x}
              y2={t.outer.y}
              stroke={t.major ? 'rgba(103,232,249,0.45)' : 'rgba(120,113,108,0.35)'}
              strokeWidth={t.major ? 1.5 : 1}
            />
          ))}

          {/* threshold blade */}
          <line
            x1={threshInner.x}
            y1={threshInner.y}
            x2={threshOuter.x}
            y2={threshOuter.y}
            stroke="#fbbf24"
            strokeWidth={2.5}
            strokeLinecap="round"
            filter={`url(#${glowId})`}
          />
          <circle cx={threshOuter.x} cy={threshOuter.y} r={3} fill="#fbbf24" />

          {/* core readout */}
          <circle
            cx={cx}
            cy={cy}
            r={52}
            fill="rgba(12,10,9,0.92)"
            stroke="rgba(34,211,238,0.35)"
            strokeWidth={1}
          />
          <text
            x={cx}
            y={cy + 8}
            textAnchor="middle"
            fill={accent}
            fontSize="34"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fontWeight="600"
          >
            {`${Math.round(outlook)}%`}
          </text>
        </svg>

        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-stone-500">
          порог <span className="text-amber-300">{threshold}%</span>
        </p>
      </div>
    </section>
  )
}

/** Spider/radar for readiness criteria vs disaster threshold. */
export function CriteriaRadar({
  criteria,
  threshold,
  activeId,
  onSelect,
  className,
}: {
  criteria: Array<{ id: string; label: string; score: number }>
  threshold: number
  activeId?: string | null
  onSelect?: (id: string) => void
  className?: string
}) {
  const uid = useId()
  const n = criteria.length
  if (n < 3) return null

  const size = 320
  const cx = size / 2
  const cy = size / 2
  const maxR = 108
  const start = -Math.PI / 2

  function point(i: number, pct: number) {
    const a = start + (i / n) * Math.PI * 2
    const r = (Math.min(100, Math.max(0, pct)) / 100) * maxR
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
  }

  function ringPath(pct: number) {
    return criteria
      .map((_, i) => {
        const p = point(i, pct)
        return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
      })
      .join(' ') + ' Z'
  }

  const scorePts = criteria.map((c, i) => point(i, c.score))
  const scoreD =
    scorePts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') +
    ' Z'

  const rings = [25, 50, 75, 100]
  const glowId = `${uid}-radar-glow`

  return (
    <div className={cn('relative w-full max-w-[22rem]', className)}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-auto w-full"
        role="img"
        aria-label="Радар критериев выживания"
      >
        <defs>
          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {rings.map((pct) => (
          <path
            key={pct}
            d={ringPath(pct)}
            fill="none"
            stroke={pct === 50 ? 'rgba(251,191,36,0.35)' : 'rgba(120,113,108,0.28)'}
            strokeWidth={pct === 50 ? 1.25 : 1}
            strokeDasharray={pct === 50 ? undefined : '3 4'}
          />
        ))}

        {/* threshold polygon */}
        <path
          d={ringPath(threshold)}
          fill="rgba(251,191,36,0.06)"
          stroke="rgba(251,191,36,0.65)"
          strokeWidth={1.5}
          strokeDasharray="5 4"
        />

        {/* axes */}
        {criteria.map((c, i) => {
          const tip = point(i, 100)
          const active = activeId === c.id
          return (
            <line
              key={`ax-${c.id}`}
              x1={cx}
              y1={cy}
              x2={tip.x}
              y2={tip.y}
              stroke={active ? 'rgba(34,211,238,0.55)' : 'rgba(120,113,108,0.35)'}
              strokeWidth={active ? 1.5 : 1}
            />
          )
        })}

        <path
          d={scoreD}
          fill="rgba(52,211,153,0.18)"
          stroke="#34d399"
          strokeWidth={2}
          filter={`url(#${glowId})`}
        />

        {criteria.map((c, i) => {
          const p = point(i, c.score)
          const active = activeId === c.id
          return (
            <circle
              key={`pt-${c.id}`}
              cx={p.x}
              cy={p.y}
              r={active ? 5.5 : 3.5}
              fill={active ? '#22d3ee' : c.score >= threshold ? '#34d399' : '#fb7185'}
              stroke={active ? '#ecfeff' : 'rgba(12,10,9,0.8)'}
              strokeWidth={1.5}
              className={onSelect ? 'cursor-pointer' : undefined}
              onClick={() => onSelect?.(c.id)}
            />
          )
        })}

        {criteria.map((c, i) => {
          const labelR = maxR + 22
          const a = start + (i / n) * Math.PI * 2
          const x = cx + labelR * Math.cos(a)
          const y = cy + labelR * Math.sin(a)
          const active = activeId === c.id
          const short =
            c.label.length > 12 ? `${c.label.slice(0, 10)}…` : c.label
          return (
            <text
              key={`lb-${c.id}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={active ? '#a5f3fc' : 'rgba(214,211,209,0.85)'}
              fontSize={11}
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              className={onSelect ? 'cursor-pointer' : undefined}
              onClick={() => onSelect?.(c.id)}
            >
              {short}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
