'use client'
import React from 'react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, BookOpen } from 'lucide-react'
import { ExamCard } from '@/components/exam/ExamCard'
import { CreateExamModal } from '@/components/exam/CreateExamModal'

export default function ExamsPage() {
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: () => fetch('/api/exams').then(r => r.json()),
  })

  const exams = data?.data || []

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-wide">MY EXAMS</h1>
          <p className="text-sf-muted text-sm mt-0.5">{exams.length} exam{exams.length !== 1 ? 's' : ''} in preparation</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} />
          Add Exam
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass rounded-2xl h-48 border border-sf-border/40 animate-pulse" />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div className="glass rounded-2xl border border-dashed border-sf-border/60 p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-sf-cyan/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-sf-cyan" />
          </div>
          <p className="font-display text-xl font-bold text-white mb-2">No exams added yet</p>
          <p className="text-sf-muted text-sm mb-6 max-w-xs mx-auto">
            Add your first exam to start generating AI-powered study plans
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            Add Your First Exam
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((exam: any) => (
            <ExamCard key={exam.id} exam={exam as any} />
          ))}
          <button
            onClick={() => setShowCreate(true)}
            className="glass rounded-2xl border border-dashed border-sf-border/40 hover:border-sf-cyan/30 flex flex-col items-center justify-center gap-3 p-8 text-sf-muted hover:text-sf-cyan transition-all group min-h-[180px]"
          >
            <div className="w-10 h-10 rounded-xl bg-sf-panel flex items-center justify-center group-hover:bg-sf-cyan/10 transition-colors">
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-200" />
            </div>
            <span className="text-sm font-medium">Add Another Exam</span>
          </button>
        </div>
      )}

      <CreateExamModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}
