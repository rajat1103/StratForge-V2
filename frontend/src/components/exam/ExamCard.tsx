'use client'
import React from 'react'
import Link from 'next/link'
import { Calendar, BookOpen, TrendingUp, ChevronRight } from 'lucide-react'
import { ProgressRing } from '@/components/charts/ProgressRing'
import { daysUntil, formatDate, getThemeConfig } from '@/lib/utils'
import { Exam } from '@/types'

export function ExamCard({ exam }: { exam: any; key?: React.Key }) {
  const days = daysUntil(exam.examDate)
  const theme = getThemeConfig(exam.theme)
  const color = exam.colorAccent || theme.primary

  const completedTopics = exam?.topics?.filter((t: any) => t.status === 'completed').length || 0
  const totalTopics = exam.topics?.length || exam.totalTopics || 0

  const urgencyColor =
    days !== null && days <= 7  ? '#FF4466' :
    days !== null && days <= 30 ? '#FFB347' : color

  return (
    <Link href={`/exam/${exam.id}`}>
      <div
        className="group relative glass rounded-2xl p-5 border border-sf-border/50 hover:border-opacity-80 transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
        style={{ '--accent': color } as React.CSSProperties}
      >
        {/* Accent top bar */}
        <div
          className="absolute top-0 left-6 right-6 h-0.5 rounded-b-full opacity-60 group-hover:opacity-100 transition-opacity"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
        />

        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            {/* Theme badge */}
            <span
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mb-2"
              style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
            >
              <span>{theme.icon}</span>
              <span className="font-medium">{theme.label}</span>
            </span>
            <h3 className="font-display text-base font-bold text-white leading-tight truncate pr-2">
              {exam.title}
            </h3>
          </div>
          <ProgressRing
            value={exam.completionPct}
            size={62}
            strokeWidth={5}
            color={color}
            animated
          />
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-sf-muted mb-3">
          <span className="flex items-center gap-1">
            <BookOpen size={11} />
            {completedTopics}/{totalTopics} topics
          </span>
          {exam.examDate && (
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {formatDate(exam.examDate, 'MMM d')}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="mastery-bar mb-3">
          <div
            className="mastery-bar-fill"
            style={{
              width: `${exam.completionPct}%`,
              background: `linear-gradient(90deg, ${color}88, ${color})`,
            }}
          />
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between">
          {days !== null ? (
            <span
              className="text-xs font-display font-semibold px-2 py-0.5 rounded-full"
              style={{
                color: urgencyColor,
                background: `${urgencyColor}15`,
                border: `1px solid ${urgencyColor}30`,
              }}
            >
              {days === 0 ? 'TODAY' : days === 1 ? '1 day left' : `${days} days left`}
            </span>
          ) : (
            <span className="text-xs text-sf-muted">No deadline set</span>
          )}
          <ChevronRight
            size={14}
            className="text-sf-muted group-hover:text-sf-cyan group-hover:translate-x-0.5 transition-all"
          />
        </div>
      </div>
    </Link>
  )
}
