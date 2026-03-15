'use client'
import React from 'react'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Check, ChevronDown, ChevronUp, Plus, Clock, Star } from 'lucide-react'
import { Topic, ChecklistItem } from '@/types'
import { getMasteryColor, getMasteryLabel, getDifficultyLabel, getStatusBadgeStyle } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'

export function TopicCard({ topic, accentColor = '#00D4FF' }: { topic: any; accentColor?: string; key?: React.Key }) {
  const [expanded, setExpanded] = useState(false)
  const [logging, setLogging] = useState(false)
  const [logForm, setLogForm] = useState({ score: 70, minutes: 60, sessionType: 'study' as const })
  const [submitting, setSubmitting] = useState(false)
  const qc = useQueryClient()
  const { addNotification } = useAppStore()

  const masteryColor = getMasteryColor(topic.masteryLevel)
  const completedItems = topic.checklistItems?.filter((i: any) => i.completed).length || 0
  const totalItems = topic.checklistItems?.length || 0

  const toggleChecklist = async (item: ChecklistItem) => {
    await fetch(`/api/checklist/${item.id}`, { method: 'PATCH' })
    qc.invalidateQueries({ queryKey: ['exam'] })
  }

  const logProgress = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: topic.id, ...logForm }),
      })
      if (!res.ok) throw new Error()
      qc.invalidateQueries({ queryKey: ['exam'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      addNotification({ id: Date.now().toString(), type: 'success', title: 'Progress logged!', message: `${topic.title} updated` })
      setLogging(false)
    } catch {
      addNotification({ id: Date.now().toString(), type: 'error', title: 'Failed to log progress' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="glass rounded-xl border border-sf-border/50 overflow-hidden hover:border-opacity-70 transition-all"
      style={{ '--accent': accentColor } as React.CSSProperties}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Status indicator */}
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{
            background: masteryColor,
            boxShadow: `0 0 6px ${masteryColor}80`,
          }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-white truncate">{topic.title}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${getStatusBadgeStyle(topic.status)}`}>
              {topic.status.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-sf-muted">
            <span>Difficulty: {getDifficultyLabel(topic.difficulty)}</span>
            <span>Priority: {topic.priority}/5</span>
            <span className="flex items-center gap-1">
              <Clock size={10} />
              ~{topic.estimatedDays}d
            </span>
          </div>
        </div>

        {/* Mastery */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs font-display font-semibold" style={{ color: masteryColor }}>
            {Math.round(topic.masteryLevel * 100)}%
          </span>
          <span className="text-xs text-sf-muted">{getMasteryLabel(topic.masteryLevel)}</span>
        </div>

        <div className="text-sf-muted ml-1 shrink-0">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {/* Mastery bar */}
      <div className="h-0.5 bg-sf-border/40 mx-4">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${topic.masteryLevel * 100}%`, background: masteryColor }}
        />
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="p-4 pt-3 border-t border-sf-border/30 space-y-4 animate-slide-up">
          {/* Checklist */}
          {topic.checklistItems && topic.checklistItems.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-sf-muted font-medium">
                  Checklist ({completedItems}/{totalItems})
                </p>
              </div>
              <div className="space-y-2">
                {topic.checklistItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggleChecklist(item)}
                    className="flex items-center gap-2.5 w-full text-left group"
                  >
                    <div
                      className={cn(
                        'w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0',
                        item.completed
                          ? 'border-sf-green bg-sf-green/20'
                          : 'border-sf-border/60 group-hover:border-sf-cyan/50'
                      )}
                    >
                      {item.completed && <Check size={10} className="text-sf-green" />}
                    </div>
                    <span
                      className={cn(
                        'text-xs transition-colors',
                        item.completed ? 'text-sf-muted line-through' : 'text-sf-text group-hover:text-white'
                      )}
                    >
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Log progress / Log form */}
          {!logging ? (
            <button
              onClick={() => setLogging(true)}
              className="flex items-center gap-2 text-xs text-sf-cyan hover:text-white transition-colors font-medium"
            >
              <Plus size={12} />
              Log study session
            </button>
          ) : (
            <div className="glass-light rounded-xl p-3 space-y-3 border border-sf-border/40">
              <p className="text-xs font-medium text-white">Log Study Session</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-sf-muted block mb-1">Confidence Score</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range" min={10} max={100} step={5}
                      value={logForm.score}
                      onChange={e => setLogForm(p => ({ ...p, score: +e.target.value }))}
                      className="flex-1 accent-sf-cyan"
                    />
                    <span className="text-xs text-sf-cyan w-8">{logForm.score}%</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-sf-muted block mb-1">Time (minutes)</label>
                  <input
                    type="number" min={5} max={480}
                    value={logForm.minutes}
                    onChange={e => setLogForm(p => ({ ...p, minutes: +e.target.value }))}
                    className="sf-input py-1.5 text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                {['study', 'revision', 'practice'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setLogForm(p => ({ ...p, sessionType: t as any }))}
                    className={cn(
                      'flex-1 text-xs py-1.5 rounded-lg border transition-all capitalize',
                      logForm.sessionType === t
                        ? 'bg-sf-cyan/10 border-sf-cyan/40 text-sf-cyan'
                        : 'border-sf-border/40 text-sf-muted hover:text-sf-text'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setLogging(false)} className="btn-ghost text-xs py-1.5 flex-1">Cancel</button>
                <button
                  onClick={logProgress}
                  disabled={submitting}
                  className="btn-primary text-xs py-1.5 flex-1"
                >
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
