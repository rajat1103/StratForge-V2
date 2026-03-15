'use client'
import React from 'react'
import { useEffect, useState } from 'react'

interface ProgressRingProps {
  value: number       // 0-100
  size?: number
  strokeWidth?: number
  color?: string
  trackColor?: string
  label?: string
  sublabel?: string
  animated?: boolean
}

export function ProgressRing({
  value,
  size = 80,
  strokeWidth = 6,
  color = '#00D4FF',
  trackColor = 'rgba(30,45,74,0.8)',
  label,
  sublabel,
  animated = true,
}: ProgressRingProps) {
  const [displayed, setDisplayed] = useState(animated ? 0 : value)

  useEffect(() => {
    if (!animated) { setDisplayed(value); return }
    const timer = setTimeout(() => setDisplayed(value), 100)
    return () => clearTimeout(timer)
  }, [value, animated])

  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (displayed / 100) * circ
  const cx = size / 2

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0">
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="progress-ring-circle"
          style={{
            filter: `drop-shadow(0 0 6px ${color}66)`,
            transition: animated ? 'stroke-dashoffset 0.9s cubic-bezier(0.22,0.61,0.36,1)' : 'none',
          }}
        />
      </svg>
      <div className="flex flex-col items-center justify-center z-10 text-center">
        {label !== undefined ? (
          <span className="font-display font-bold leading-none" style={{
            fontSize: size < 60 ? 12 : size < 90 ? 16 : 22,
            color: color,
          }}>
            {label}
          </span>
        ) : (
          <span className="font-display font-bold leading-none" style={{
            fontSize: size < 60 ? 12 : size < 90 ? 16 : 22,
            color: color,
          }}>
            {Math.round(displayed)}%
          </span>
        )}
        {sublabel && (
          <span className="text-sf-muted leading-none mt-0.5" style={{ fontSize: size < 90 ? 9 : 11 }}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  )
}
