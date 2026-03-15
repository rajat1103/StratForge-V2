'use client'
import React from 'react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, addDays, startOfWeek, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar, Sparkles, CheckCircle, Clock } from 'lucide-react'
import { cn, formatMinutes } from '@/lib/utils'

export default function PlannerPage() {
  const [weekOffset, setWeekOffset] = useState(0)

  const { data } = useQuery({
    queryKey: ['plans'],
    queryFn: () => fetch('/api/plans').then(r => r.json()),
  })

  const plans = data?.data || []
  const allTasks = plans.flatMap((p: any) =>
    (p.tasks || []).map((t: any) => ({
      ...t,
      examTitle: p.exam?.title || 'Unknown',
      examColor: p.exam?.colorAccent || '#00D4FF',
    }))
  )

  const weekStart = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const tasksForDay = (day: Date) =>
    allTasks.filter((t: any) => isSameDay(new Date(t.scheduledDate), day))

  const totalThisWeek = weekDays.reduce((sum, day) => {
    const tasks = tasksForDay(day)
    return sum + tasks.reduce((s: number, t: any) => s + (t.durationMins || 0), 0)
  }, 0)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-wide">STUDY PLANNER</h1>
          <p className="text-sf-muted text-sm mt-0.5">
            {plans.length > 0 ? `${plans.length} active plan${plans.length > 1 ? 's' : ''}` : 'No plans generated yet'}
            {totalThisWeek > 0 && ` · ${formatMinutes(totalThisWeek)} scheduled this week`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="w-8 h-8 glass rounded-xl border border-sf-border/50 flex items-center justify-center text-sf-muted hover:text-sf-cyan transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="text-xs text-sf-cyan hover:underline px-2"
          >
            Today
          </button>
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            className="w-8 h-8 glass rounded-xl border border-sf-border/50 flex items-center justify-center text-sf-muted hover:text-sf-cyan transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="glass rounded-2xl border border-dashed border-sf-border/60 p-16 text-center">
          <Sparkles size={32} className="text-sf-cyan mx-auto mb-3 opacity-60" />
          <p className="font-display text-lg font-bold text-white mb-2">No study plan yet</p>
          <p className="text-sf-muted text-sm mb-4">Go to an exam page and generate an AI study plan</p>
        </div>
      ) : (
        <>
          {/* Week label */}
          <div className="glass rounded-xl border border-sf-border/40 px-4 py-2 inline-flex items-center gap-2 text-sm">
            <Calendar size={14} className="text-sf-cyan" />
            <span className="text-white font-medium">
              {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </span>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map(day => {
              const tasks = tasksForDay(day)
              const isToday = isSameDay(day, new Date())
              const totalMins = tasks.reduce((s: number, t: any) => s + (t.durationMins || 0), 0)

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'glass rounded-xl border p-2 min-h-[140px] transition-all',
                    isToday ? 'border-sf-cyan/40 bg-sf-cyan/5' : 'border-sf-border/40'
                  )}
                >
                  {/* Day header */}
                  <div className={cn('text-center mb-2 pb-2 border-b border-sf-border/30')}>
                    <p className="text-xs text-sf-muted">{format(day, 'EEE')}</p>
                    <p
                      className={cn(
                        'font-display font-bold text-sm',
                        isToday ? 'text-sf-cyan' : 'text-white'
                      )}
                    >
                      {format(day, 'd')}
                    </p>
                    {totalMins > 0 && (
                      <p className="text-xs text-sf-muted mt-0.5">{formatMinutes(totalMins)}</p>
                    )}
                  </div>

                  {/* Tasks */}
                  <div className="space-y-1">
                    {tasks.slice(0, 4).map((task: any) => (
                      <div
                        key={task.id}
                        className={cn(
                          'rounded-lg px-1.5 py-1 text-xs transition-all border',
                          task.completed ? 'opacity-50' : ''
                        )}
                        style={{
                          background: `${task.examColor}12`,
                          borderColor: `${task.examColor}25`,
                          color: task.examColor,
                        }}
                      >
                        <div className="flex items-center gap-1">
                          {task.completed
                            ? <CheckCircle size={9} />
                            : <Clock size={9} />
                          }
                          <span className="truncate leading-tight font-medium">
                            {task.topic?.title || 'Topic'}
                          </span>
                        </div>
                        <p className="text-xs opacity-70 mt-0.5 truncate">{formatMinutes(task.durationMins)}</p>
                      </div>
                    ))}
                    {tasks.length > 4 && (
                      <p className="text-xs text-sf-muted text-center">+{tasks.length - 4} more</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Plan summary cards */}
          <div className="space-y-3">
            <h2 className="font-display text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <div className="w-1 h-4 bg-sf-green rounded-full" />
              ACTIVE PLANS
            </h2>
            {plans.map((plan: any) => {
              const schedule = plan.schedule as any
              const tasksCompleted = (plan.tasks || []).filter((t: any) => t.completed).length
              const totalTasks = (plan.tasks || []).length
              return (
                <div key={plan.id} className="glass rounded-xl border border-sf-border/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-white">{plan.exam?.title}</p>
                      <p className="text-xs text-sf-muted">
                        Generated {format(new Date(plan.generatedAt), 'MMM d')}
                        {plan.exam?.examDate && ` · Exam: ${format(new Date(plan.exam.examDate), 'MMM d')}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-sm text-sf-cyan">{tasksCompleted}/{totalTasks}</p>
                      <p className="text-xs text-sf-muted">tasks done</p>
                    </div>
                  </div>
                  {schedule?.insights && (
                    <div className="space-y-1">
                      {schedule.insights.slice(0, 2).map((insight: string, i: number) => (
                        <p key={i} className="text-xs text-sf-muted flex items-start gap-1.5">
                          <span className="text-sf-cyan mt-0.5">›</span>
                          {insight}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
