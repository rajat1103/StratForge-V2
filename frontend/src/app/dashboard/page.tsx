'use client'
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Zap, Flame, Clock, Plus, Target, Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { StatCard } from '@/components/dashboard/StatCard'
import { ExamCard } from '@/components/exam/ExamCard'
import { AIInsightsPanel } from '@/components/ai/AIInsightsPanel'
import { WeeklyChart } from '@/components/charts/WeeklyChart'
import { MasteryHeatmap } from '@/components/charts/MasteryHeatmap'
import { ProgressRing } from '@/components/charts/ProgressRing'
import { formatMinutes, daysUntil } from '@/lib/utils'
import { DashboardStats } from '@/types'

export default function DashboardPage() {
  const { data, isLoading, refetch } = useQuery<{ data: DashboardStats }>({
    queryKey: ['dashboard'],
    queryFn: () => fetch('/api/dashboard').then(r => r.json()),
    refetchInterval: 120_000,
  })

  const { data: examsData } = useQuery({
    queryKey: ['exams'],
    queryFn: () => fetch('/api/exams').then(r => r.json()),
  })

  const stats = data?.data
  const exams = examsData?.data || []

  if (isLoading) return <DashboardSkeleton />

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Active Exams"
          value={stats?.activeExams || 0}
          icon={<BookOpen size={14} />}
          color="#00D4FF"
          subvalue="in preparation"
        />
        <StatCard
          label="Avg Completion"
          value={`${stats?.avgCompletion || 0}%`}
          icon={<Target size={14} />}
          color="#00FF9C"
          subvalue="across all exams"
          trend="up"
          trendLabel="+4% this week"
        />
        <StatCard
          label="Today's Study"
          value={formatMinutes(stats?.todayMinutes || 0)}
          icon={<Clock size={14} />}
          color="#FFB347"
          subvalue="target: 2h 00m"
        />
        <StatCard
          label="Study Streak"
          value={stats?.currentStreak || 0}
          icon={<Flame size={14} />}
          color="#FF4466"
          subvalue={`${stats?.currentStreak || 0} days consecutive`}
          trend={stats?.currentStreak ? 'up' : 'neutral'}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Left: Exams */}
        <div className="xl:col-span-2 space-y-5">

          {/* Exams section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base font-bold text-white tracking-wide flex items-center gap-2">
                <div className="w-1 h-4 bg-sf-cyan rounded-full" />
                MY EXAMS
              </h2>
              <Link
                href="/exam"
                className="flex items-center gap-1 text-xs text-sf-cyan hover:text-white transition-colors"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {exams.length === 0 ? (
              <div className="glass rounded-2xl border border-dashed border-sf-border/60 p-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-sf-cyan/10 flex items-center justify-center mx-auto mb-3">
                  <Plus size={20} className="text-sf-cyan" />
                </div>
                <p className="text-sf-text font-medium mb-1">No exams yet</p>
                <p className="text-sf-muted text-sm mb-4">Add your first exam to start planning</p>
                <Link href="/exam" className="btn-primary text-sm">
                  Add Exam
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {exams.slice(0, 4).map((exam: any) => (
                  <ExamCard key={exam.id} exam={exam as any} />
                ))}
                <Link
                  href="/exam"
                  className="glass rounded-2xl border border-dashed border-sf-border/40 hover:border-sf-cyan/30 flex items-center justify-center gap-2 p-5 text-sf-muted hover:text-sf-cyan transition-all group min-h-[120px]"
                >
                  <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                  <span className="text-sm font-medium">Add Exam</span>
                </Link>
              </div>
            )}
          </section>

          {/* Weekly activity */}
          <section className="glass rounded-2xl border border-sf-border/50 p-5">
            <h2 className="font-display text-sm font-bold text-white tracking-wide flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-sf-amber rounded-full" />
              WEEKLY ACTIVITY
            </h2>
            <WeeklyChart data={stats?.weeklyProgress || []} />
            <div className="flex items-center justify-between mt-3 text-xs text-sf-muted">
              <span>Study time vs 2h daily target</span>
              <span className="text-sf-cyan">
                {stats?.weeklyProgress
                  ? `${stats.weeklyProgress.reduce((s, d) => s + d.minutes, 0)}m this week`
                  : '—'}
              </span>
            </div>
          </section>

          {/* Topic mastery heatmap */}
          <section className="glass rounded-2xl border border-sf-border/50 p-5">
            <h2 className="font-display text-sm font-bold text-white tracking-wide flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-sf-purple rounded-full" />
              TOPIC MASTERY MAP
            </h2>
            <MasteryHeatmap data={stats?.topicHeatmap || []} />
          </section>
        </div>

        {/* Right: AI + Deadlines */}
        <div className="space-y-4">

          {/* AI Insights */}
          <div className="glass rounded-2xl border border-sf-border/50 p-4">
            <AIInsightsPanel
              insights={stats?.recentInsights || []}
              onRefresh={() => refetch()}
            />
          </div>

          {/* Upcoming deadlines */}
          {(stats?.upcomingDeadlines?.length || 0) > 0 && (
            <div className="glass rounded-2xl border border-sf-border/50 p-4">
              <h3 className="font-display text-sm font-bold text-white tracking-wide flex items-center gap-2 mb-3">
                <Calendar size={14} className="text-sf-red" />
                UPCOMING DEADLINES
              </h3>
              <div className="space-y-3">
                {stats!.upcomingDeadlines.map(d => {
                  const urgency =
                    d.daysLeft <= 7  ? '#FF4466' :
                    d.daysLeft <= 30 ? '#FFB347' : '#00D4FF'
                  return (
                    <Link key={d.examId} href={`/exam/${d.examId}`}>
                      <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-sf-panel/60 transition-colors group">
                        <ProgressRing
                          value={d.completionPct}
                          size={44}
                          strokeWidth={4}
                          color={urgency}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{d.examTitle}</p>
                          <p className="text-xs font-display font-semibold mt-0.5" style={{ color: urgency }}>
                            {d.daysLeft === 0 ? 'TODAY!' : `${d.daysLeft}d left`}
                          </p>
                        </div>
                        <ArrowRight size={12} className="text-sf-muted group-hover:text-sf-cyan transition-colors" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="glass rounded-2xl border border-sf-border/50 p-4">
            <h3 className="font-display text-sm font-bold text-white tracking-wide mb-3">QUICK ACTIONS</h3>
            <div className="space-y-2">
              {[
                { href: '/focus',     icon: Zap,      label: 'Start Focus Session', color: '#00D4FF' },
                { href: '/assistant', icon: BookOpen,  label: 'Ask AI Assistant',    color: '#9B6DFF' },
                { href: '/planner',   icon: Calendar,  label: 'View Study Plan',     color: '#FFB347' },
              ].map(({ href, icon: Icon, label, color }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-sf-panel/60 transition-all group"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${color}18`, color }}
                  >
                    <Icon size={13} />
                  </div>
                  <span className="text-sm text-sf-muted group-hover:text-sf-text transition-colors">{label}</span>
                  <ArrowRight size={12} className="ml-auto text-sf-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass rounded-2xl p-4 h-24 border border-sf-border/40" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass rounded-2xl h-40 border border-sf-border/40" />
            ))}
          </div>
          <div className="glass rounded-2xl h-48 border border-sf-border/40" />
        </div>
        <div className="space-y-4">
          <div className="glass rounded-2xl h-64 border border-sf-border/40" />
          <div className="glass rounded-2xl h-40 border border-sf-border/40" />
        </div>
      </div>
    </div>
  )
}
