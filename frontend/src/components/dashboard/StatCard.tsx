'use client'
import React from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  subvalue?: string
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
  icon?: React.ReactNode
  color?: string
  className?: string
  animate?: boolean
}

export function StatCard({
  label,
  value,
  subvalue,
  trend,
  trendLabel,
  icon,
  color = '#00D4FF',
  className,
  animate = true,
}: StatCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? '#00FF9C' : trend === 'down' ? '#FF4466' : '#64748B'

  return (
    <div
      className={cn(
        'glass rounded-2xl p-4 border border-sf-border/50 relative overflow-hidden group',
        className
      )}
    >
      {/* Background accent */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 blur-2xl group-hover:opacity-10 transition-opacity"
        style={{ background: color }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs text-sf-muted font-medium uppercase tracking-wider">{label}</p>
          {icon && (
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `${color}18`, color }}
            >
              {icon}
            </div>
          )}
        </div>

        <p
          className={cn('font-display text-3xl font-bold leading-none', animate && 'animate-number-tick')}
          style={{ color }}
        >
          {value}
        </p>

        <div className="flex items-center gap-2 mt-2">
          {subvalue && <p className="text-xs text-sf-muted">{subvalue}</p>}
          {trend && trendLabel && (
            <div className="flex items-center gap-1">
              <TrendIcon size={11} style={{ color: trendColor }} />
              <span className="text-xs" style={{ color: trendColor }}>{trendLabel}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
