'use client'
import React from 'react'
import { HeatmapEntry } from '@/types'
import { getMasteryColor, getMasteryLabel } from '@/lib/utils'
import { useState } from 'react'

interface MasteryHeatmapProps {
  data: HeatmapEntry[]
}

export function MasteryHeatmap({ data }: MasteryHeatmapProps) {
  const [hovered, setHovered] = useState<string | null>(null)

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-32 text-sf-muted text-sm">
        No topics yet
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1.5">
        {data.map(item => {
          const color = getMasteryColor(item.masteryLevel)
          const isHovered = hovered === item.topicId
          const size = 8 + item.priority * 3

          return (
            <div
              key={item.topicId}
              onMouseEnter={() => setHovered(item.topicId)}
              onMouseLeave={() => setHovered(null)}
              className="relative cursor-pointer transition-transform duration-150"
              style={{ transform: isHovered ? 'scale(1.3)' : 'scale(1)' }}
            >
              <div
                className="rounded-sm transition-all duration-150"
                style={{
                  width: size,
                  height: size,
                  background: color,
                  opacity: item.masteryLevel < 0.05 ? 0.2 : 0.7 + item.masteryLevel * 0.3,
                  boxShadow: isHovered ? `0 0 8px ${color}` : 'none',
                }}
              />
              {isHovered && (
                <div
                  className="absolute z-50 glass rounded-lg p-2.5 text-xs w-44 pointer-events-none"
                  style={{
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: 6,
                  }}
                >
                  <p className="text-white font-medium mb-1 truncate">{item.topicTitle}</p>
                  <p className="text-sf-muted text-xs mb-1">{item.examTitle}</p>
                  <div className="flex items-center justify-between">
                    <span style={{ color }}>{getMasteryLabel(item.masteryLevel)}</span>
                    <span className="text-sf-muted">{Math.round(item.masteryLevel * 100)}%</span>
                  </div>
                  <div className="mastery-bar mt-1.5">
                    <div
                      className="mastery-bar-fill"
                      style={{ width: `${item.masteryLevel * 100}%`, background: color }}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-3 mt-2">
        {[0.1, 0.3, 0.5, 0.7, 0.9].map(v => (
          <div key={v} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ background: getMasteryColor(v) }} />
            <span className="text-sf-muted" style={{ fontSize: 10 }}>{getMasteryLabel(v)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
