import { useEffect, useRef, useState } from 'react'

/**
 * ScoreGauge — animated SVG semicircular gauge.
 * Ported and enhanced from the existing vanilla JS implementation.
 *
 * Props:
 *   score      — float 0–10
 *   size       — 'sm' | 'md' | 'lg'
 *   animated   — whether to animate on mount/score change
 *   showLabel  — show score number below gauge
 *   idle       — show placeholder state (no score yet)
 */

const GAUGE_ARC_LENGTH = 314 // ≈ π × r(100)
const CX = 120
const CY = 140
const R = 100

function getScoreBand(score) {
  if (score < 4) return { label: 'Strained', color: '#D9534F' }
  if (score < 7) return { label: 'Balanced', color: '#E3B341' }
  return { label: 'Strong', color: '#4C9A78' }
}

function drawTickPositions() {
  const ticks = []
  for (let i = 0; i <= 10; i += 2) {
    const angle = Math.PI - (i / 10) * Math.PI
    const x1 = CX + R * Math.cos(angle)
    const y1 = CY - R * Math.sin(angle)
    const x2 = CX + (R - 10) * Math.cos(angle)
    const y2 = CY - (R - 10) * Math.sin(angle)
    ticks.push({ x1, y1, x2, y2, label: i })
  }
  return ticks
}

const TICKS = drawTickPositions()

const sizeMap = {
  sm: { viewBox: '10 30 220 125', width: '180', labelSize: 'text-2xl' },
  md: { viewBox: '10 30 220 125', width: '220', labelSize: 'text-3xl' },
  lg: { viewBox: '10 30 220 125', width: '280', labelSize: 'text-4xl' },
}

export default function ScoreGauge({
  score = null,
  size = 'md',
  animated = true,
  showLabel = true,
  idle = false,
}) {
  const [displayScore, setDisplayScore] = useState(0)
  const [mounted, setMounted] = useState(false)
  const animFrameRef = useRef(null)

  useEffect(() => {
    // Trigger on next frame to allow CSS transition
    const raf = requestAnimationFrame(() => {
      setMounted(true)
      if (score !== null && !idle) {
        setDisplayScore(Math.max(0, Math.min(10, score)))
      }
    })
    return () => cancelAnimationFrame(raf)
  }, [score, idle])

  const clamped = Math.max(0, Math.min(10, displayScore))
  const offset = mounted && !idle
    ? GAUGE_ARC_LENGTH * (1 - clamped / 10)
    : GAUGE_ARC_LENGTH

  const band = getScoreBand(clamped)
  const sv = sizeMap[size] || sizeMap.md

  return (
    <div className="flex flex-col items-center gap-1 select-none" aria-label={`Mental health score gauge: ${score !== null ? score.toFixed(2) : 'not yet calculated'}`}>
      <svg
        viewBox={sv.viewBox}
        width={sv.width}
        height="auto"
        className="w-full max-w-[280px]"
        aria-hidden="true"
        role="img"
      >
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D9534F" />
            <stop offset="45%" stopColor="#E3B341" />
            <stop offset="100%" stopColor="#4C9A78" />
          </linearGradient>
          <filter id="gaugeShadow">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* Track arc */}
        <path
          d="M 20 140 A 100 100 0 0 1 220 140"
          fill="none"
          stroke="#E2E8E1"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Filled arc */}
        <path
          d="M 20 140 A 100 100 0 0 1 220 140"
          fill="none"
          stroke={idle ? '#E2E8E1' : 'url(#gaugeGradient)'}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={GAUGE_ARC_LENGTH}
          strokeDashoffset={offset}
          className={animated ? 'gauge-fill-path' : ''}
          style={{ transition: animated ? 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'none' }}
          filter={!idle ? 'url(#gaugeShadow)' : undefined}
        />

        {/* Tick marks */}
        {TICKS.map(({ x1, y1, x2, y2, label }) => (
          <g key={label}>
            <line
              x1={x1.toFixed(1)}
              y1={y1.toFixed(1)}
              x2={x2.toFixed(1)}
              y2={y2.toFixed(1)}
              stroke="#D6DED5"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>
        ))}

        {/* Hub circle */}
        <circle
          cx={CX}
          cy={CY}
          r="5"
          fill={idle ? '#D6DED5' : band.color}
          style={{ transition: animated ? 'fill 0.8s ease' : 'none' }}
        />
      </svg>

      {/* Score readout */}
      {showLabel && (
        <div className="flex flex-col items-center -mt-2">
          {idle ? (
            <p className="font-mono text-ink-faint text-sm tracking-wide">— / 10</p>
          ) : (
            <>
              <div className="flex items-baseline gap-1">
                <span className={`font-mono font-semibold text-pine-deep ${sv.labelSize}`}>
                  {clamped.toFixed(2)}
                </span>
                <span className="font-mono text-ink-faint text-sm">/10</span>
              </div>
              <span
                className="font-mono text-xs uppercase tracking-[0.12em] mt-0.5"
                style={{ color: band.color }}
              >
                {band.label}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  )
}
