'use client'
import React from 'react'
import { Brain, Zap, TrendingUp, AlertTriangle, Star, RefreshCw } from 'lucide-react'
import { AIInsight } from '@/types'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

interface AIInsightsPanelProps {
  insights: AIInsight[]
  onRefresh?: () => void
}

const INSIGHT_ICONS: Record<string, React.ReactNode> = {
  weak_topic:          <AlertTriangle size={14} className="text-sf-amber" />,
  schedule_suggestion: <Zap size={14} className="text-sf-cyan" />,
  prediction:          <TrendingUp size={14} className="text-sf-green" />,
  motivation:          <Star size={14} className="text-sf-purple" />,
  weekly_report:       <Brain size={14} className="text-sf-blue" />,
}

const INSIGHT_COLORS: Record<string, string> = {
  weak_topic:          '#FFB347',
  schedule_suggestion: '#00D4FF',
  prediction:          '#00FF9C',
  motivation:          '#9B6DFF',
  weekly_report:       '#0066FF',
}

export function AIInsightsPanel({ insights, onRefresh }: AIInsightsPanelProps) {
  const [generating, setGenerating] = useState(false)
  const qc = useQueryClient()

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await fetch('/api/insights', { method: 'POST' })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['insights'] })
      onRefresh?.()
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-sf-cyan" />
          <span className="text-sm font-display font-semibold text-white">AI Insights</span>
          {insights.filter((i: any) => !i.read).length > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-sf-red/20 text-sf-red border border-sf-red/30">
              {insights.filter((i: any) => !i.read).length}
            </span>
          )}
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="text-sf-muted hover:text-sf-cyan transition-colors disabled:opacity-50"
          title="Generate new insights"
        >
          <RefreshCw size={13} className={cn(generating && 'animate-spin')} />
        </button>
      </div>

      {insights.length === 0 ? (
        <div className="text-center py-6">
          <Brain size={24} className="text-sf-muted mx-auto mb-2 opacity-40" />
          <p className="text-xs text-sf-muted">No insights yet</p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="mt-2 text-xs text-sf-cyan hover:underline disabled:opacity-50"
          >
            {generating ? 'Analyzing...' : 'Generate insights'}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {insights.slice(0, 4).map(insight => {
            const color = INSIGHT_COLORS[insight.insightType] || '#00D4FF'
            return (
              <div
                key={insight.id}
                className={cn(
                  'rounded-xl p-3 border transition-all',
                  'hover:border-opacity-50',
                  !insight.read ? 'bg-sf-panel/80' : 'bg-sf-panel/40 opacity-70'
                )}
                style={{ borderColor: `${color}25`, background: `${color}06` }}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 shrink-0">
                    {INSIGHT_ICONS[insight.insightType]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white mb-0.5 leading-tight">
                      {insight.title}
                    </p>
                    <p className="text-xs text-sf-muted leading-snug line-clamp-2">
                      {insight.content}
                    </p>
                  </div>
                  {!insight.read && (
                    <div className="w-1.5 h-1.5 rounded-full bg-sf-cyan shrink-0 mt-1" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
