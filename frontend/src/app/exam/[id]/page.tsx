'use client'
import React from 'react'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Zap, Calendar, BookOpen, TrendingUp, ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { TopicCard } from '@/components/exam/TopicCard'
import { AddTopicModal } from '@/components/exam/AddTopicModal'
import { ProgressRing } from '@/components/charts/ProgressRing'
import { daysUntil, formatDate, getThemeConfig, getMasteryColor, calculateExamReadiness, cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'

export default function ExamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [showAddTopic, setShowAddTopic] = useState(false)
  const [generatingPlan, setGeneratingPlan] = useState(false)
  const [dailyHours, setDailyHours] = useState(4)
  const { addNotification } = useAppStore()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['exam', id],
    queryFn: () => fetch(`/api/exams/${id}`).then(r => r.json()),
  })

  const exam = data?.data
  const theme = exam ? getThemeConfig(exam.theme) : null
  const color = exam?.colorAccent || '#00D4FF'
  const days = daysUntil(exam?.examDate)
  const readiness = exam?.topics ? calculateExamReadiness(exam.topics) : 0

  const generatePlan = async () => {
    setGeneratingPlan(true)
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId: id, dailyHours }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }
      qc.invalidateQueries({ queryKey: ['exam', id] })
      addNotification({ id: Date.now().toString(), type: 'success', title: 'Study plan generated!', message: 'Your AI plan is ready' })
    } catch (err: unknown) {
      addNotification({ id: Date.now().toString(), type: 'error', title: 'Plan generation failed', message: (err as Error).message })
    } finally {
      setGeneratingPlan(false)
    }
  }

  if (isLoading) return (
    <div className="space-y-4 animate-pulse">
      <div className="glass rounded-2xl h-48 border border-sf-border/40" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="glass rounded-xl h-20 border border-sf-border/40" />)}
      </div>
    </div>
  )

  if (!exam) return (
    <div className="text-center py-20 text-sf-muted">Exam not found</div>
  )

  const topicsByStatus = {
    not_started:    exam.topics?.filter((t: any) => t.status === 'not_started') || [],
    in_progress:    exam.topics?.filter((t: any) => t.status === 'in_progress') || [],
    completed:      exam.topics?.filter((t: any) => t.status === 'completed') || [],
    needs_revision: exam.topics?.filter((t: any) => t.status === 'needs_revision') || [],
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Back */}
      <Link href="/exam" className="inline-flex items-center gap-1.5 text-sm text-sf-muted hover:text-sf-cyan transition-colors">
        <ArrowLeft size={14} />
        All Exams
      </Link>

      {/* Hero header */}
      <div
        className="glass rounded-2xl border p-6 relative overflow-hidden"
        style={{ borderColor: `${color}30` }}
      >
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${color}80, transparent)` }} />
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full opacity-5 blur-3xl" style={{ background: color }} />

        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{theme?.icon}</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
                {theme?.label}
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold text-white mb-1">{exam.title}</h1>
            {exam.description && <p className="text-sf-muted text-sm">{exam.description}</p>}

            <div className="flex items-center flex-wrap gap-4 mt-3">
              {exam.examDate && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Calendar size={13} className="text-sf-muted" />
                  <span className="text-sf-text">{formatDate(exam.examDate)}</span>
                  {days !== null && (
                    <span className="font-display font-semibold ml-1" style={{
                      color: days <= 7 ? '#FF4466' : days <= 30 ? '#FFB347' : color
                    }}>
                      ({days === 0 ? 'TODAY' : `${days}d left`})
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-sm text-sf-muted">
                <BookOpen size={13} />
                {exam.topics?.length || 0} topics
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <TrendingUp size={13} style={{ color }} />
                <span style={{ color }}>{readiness}% readiness</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <ProgressRing value={exam.completionPct} size={90} strokeWidth={7} color={color} sublabel="complete" />
            <ProgressRing value={readiness} size={70} strokeWidth={5} color={getMasteryColor(readiness / 100)} sublabel="ready" />
          </div>
        </div>

        {/* Generate Plan */}
        <div className="mt-4 pt-4 border-t border-sf-border/30 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-sf-muted">
            <span>Daily study:</span>
            <input
              type="range" min={1} max={12} step={0.5}
              value={dailyHours}
              onChange={e => setDailyHours(+e.target.value)}
              className="w-24 accent-sf-cyan"
            />
            <span className="text-sf-cyan font-mono text-xs w-8">{dailyHours}h</span>
          </div>
          <button
            onClick={generatePlan}
            disabled={generatingPlan || (exam.topics?.length || 0) === 0}
            className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <Sparkles size={14} className={cn(generatingPlan && 'animate-spin')} />
            {generatingPlan ? 'Generating AI Plan...' : 'Generate Study Plan'}
          </button>
          <button onClick={() => setShowAddTopic(true)} className="btn-ghost flex items-center gap-2 text-sm">
            <Plus size={14} />
            Add Topic
          </button>
        </div>
      </div>

      {/* Topics by status */}
      {exam.topics?.length === 0 ? (
        <div className="glass rounded-2xl border border-dashed border-sf-border/50 p-12 text-center">
          <BookOpen size={32} className="text-sf-muted mx-auto mb-3 opacity-40" />
          <p className="text-sf-text font-medium mb-1">No topics yet</p>
          <p className="text-sf-muted text-sm mb-4">Add topics to your exam to get started</p>
          <button onClick={() => setShowAddTopic(true)} className="btn-primary">Add First Topic</button>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(topicsByStatus).map(([status, topics]) => {
            if (topics.length === 0) return null
            const statusLabels: Record<string, { label: string; color: string }> = {
              in_progress:    { label: 'In Progress',    color: '#00D4FF' },
              not_started:    { label: 'Not Started',    color: '#64748B' },
              completed:      { label: 'Completed',      color: '#00FF9C' },
              needs_revision: { label: 'Needs Revision', color: '#FFB347' },
            }
            const s = statusLabels[status]
            return (
              <section key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
                  <h3 className="font-display text-sm font-bold text-white tracking-wide">{s.label.toUpperCase()}</h3>
                  <span className="text-xs text-sf-muted">({topics.length})</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {topics.map((topic: any) => (
                    <TopicCard key={topic.id} topic={topic as any} accentColor={color} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <AddTopicModal open={showAddTopic} onClose={() => setShowAddTopic(false)} examId={id} />
    </div>
  )
}
