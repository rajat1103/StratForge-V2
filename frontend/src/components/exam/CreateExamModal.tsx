'use client'
import React from 'react'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/lib/store'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'

const EXAM_TYPES = [
  { value: 'competitive', label: 'Competitive Exam', icon: '🏆' },
  { value: 'university',  label: 'University Course', icon: '🎓' },
  { value: 'certification', label: 'Certification',   icon: '📜' },
  { value: 'skill',       label: 'Skill Course',      icon: '💡' },
]

const THEMES = [
  { value: 'engineering', label: 'Engineering', color: '#00D4FF', icon: '⚙️' },
  { value: 'medical',     label: 'Medical',     color: '#00FF9C', icon: '🏥' },
  { value: 'finance',     label: 'Finance',     color: '#FFB347', icon: '📈' },
  { value: 'programming', label: 'Programming', color: '#FF6B6B', icon: '💻' },
  { value: 'minimal',     label: 'Minimal',     color: '#A0AEC0', icon: '📝' },
  { value: 'default',     label: 'General',     color: '#00D4FF', icon: '📚' },
]

interface CreateExamModalProps {
  open: boolean
  onClose: () => void
}

export function CreateExamModal({ open, onClose }: CreateExamModalProps) {
  const qc = useQueryClient()
  const { addNotification } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', type: 'competitive', examDate: '',
    description: '', theme: 'default',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      qc.invalidateQueries({ queryKey: ['exams'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      addNotification({ id: Date.now().toString(), type: 'success', title: 'Exam created!', message: form.title })
      onClose()
      setForm({ title: '', type: 'competitive', examDate: '', description: '', theme: 'default' })
    } catch (err: unknown) {
      addNotification({ id: Date.now().toString(), type: 'error', title: 'Failed to create exam', message: (err as Error).message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add New Exam" description="Set up your exam preparation tracker" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs text-sf-muted mb-1.5">Exam / Course Name *</label>
          <input
            className="sf-input"
            placeholder="e.g. JEE Advanced 2025, AWS Solutions Architect"
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            required
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs text-sf-muted mb-1.5">Type</label>
          <div className="grid grid-cols-2 gap-2">
            {EXAM_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm(p => ({ ...p, type: t.value }))}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all text-left',
                  form.type === t.value
                    ? 'bg-sf-cyan/10 border-sf-cyan/40 text-sf-cyan'
                    : 'border-sf-border/50 text-sf-muted hover:border-sf-border hover:text-sf-text'
                )}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div>
          <label className="block text-xs text-sf-muted mb-1.5">Theme</label>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm(p => ({ ...p, theme: t.value }))}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-2 rounded-xl border text-xs transition-all',
                  form.theme === t.value
                    ? 'border-opacity-60 text-white'
                    : 'border-sf-border/40 text-sf-muted hover:border-sf-border hover:text-sf-text'
                )}
                style={form.theme === t.value ? { borderColor: t.color, background: `${t.color}12` } : {}}
              >
                <span className="text-sm">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Exam Date */}
        <div>
          <label className="block text-xs text-sf-muted mb-1.5">Exam Date (optional)</label>
          <input
            type="date"
            className="sf-input"
            value={form.examDate}
            onChange={e => setForm(p => ({ ...p, examDate: e.target.value }))}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs text-sf-muted mb-1.5">Description (optional)</label>
          <textarea
            className="sf-input resize-none"
            rows={2}
            placeholder="Brief description of this exam..."
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button type="submit" disabled={loading || !form.title} className="btn-primary flex-1">
            {loading ? 'Creating...' : 'Create Exam'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
