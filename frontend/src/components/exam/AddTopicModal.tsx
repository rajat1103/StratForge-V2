'use client'
import React from 'react'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface AddTopicModalProps {
  open: boolean
  onClose: () => void
  examId: string
}

const DEFAULT_CHECKLIST = [
  'Read theory & concepts',
  'Solve practice problems',
  'Review previous year questions',
  'Take topic test',
]

export function AddTopicModal({ open, onClose, examId }: AddTopicModalProps) {
  const qc = useQueryClient()
  const { addNotification } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '',
    difficulty: 3, priority: 3, estimatedDays: 5,
  })
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST)
  const [newItem, setNewItem] = useState('')

  const addItem = () => {
    if (newItem.trim()) {
      setChecklist(p => [...p, newItem.trim()])
      setNewItem('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId,
          ...form,
          checklistItems: checklist.map((label, order) => ({ label, order })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      qc.invalidateQueries({ queryKey: ['exam', examId] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      addNotification({ id: Date.now().toString(), type: 'success', title: 'Topic added!', message: form.title })
      onClose()
      setForm({ title: '', description: '', difficulty: 3, priority: 3, estimatedDays: 5 })
      setChecklist(DEFAULT_CHECKLIST)
    } catch (err: unknown) {
      addNotification({ id: Date.now().toString(), type: 'error', title: 'Failed', message: (err as Error).message })
    } finally {
      setLoading(false)
    }
  }

  const ratingButtons = (field: 'difficulty' | 'priority', max = 5) => (
    <div className="flex gap-1.5">
      {Array.from({ length: max }, (_, i) => i + 1).map(v => (
        <button
          key={v}
          type="button"
          onClick={() => setForm(p => ({ ...p, [field]: v }))}
          className={cn(
            'w-8 h-8 rounded-lg text-xs font-bold border transition-all',
            form[field] === v
              ? field === 'difficulty'
                ? 'bg-sf-red/20 border-sf-red/50 text-sf-red'
                : 'bg-sf-amber/20 border-sf-amber/50 text-sf-amber'
              : 'border-sf-border/50 text-sf-muted hover:border-sf-border hover:text-sf-text'
          )}
        >
          {v}
        </button>
      ))}
    </div>
  )

  return (
    <Modal open={open} onClose={onClose} title="Add Topic" description="Add a topic to your study plan" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-sf-muted mb-1.5">Topic Name *</label>
          <input
            className="sf-input"
            placeholder="e.g. Electromagnetism, Organic Chemistry, VPC Networking"
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-sf-muted mb-1.5">Difficulty (1-5)</label>
            {ratingButtons('difficulty')}
          </div>
          <div>
            <label className="block text-xs text-sf-muted mb-1.5">Priority (1-5)</label>
            {ratingButtons('priority')}
          </div>
          <div>
            <label className="block text-xs text-sf-muted mb-1.5">Est. Days</label>
            <input
              type="number" min={1} max={60}
              className="sf-input text-center"
              value={form.estimatedDays}
              onChange={e => setForm(p => ({ ...p, estimatedDays: +e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-sf-muted mb-1.5">Checklist Items</label>
          <div className="space-y-1.5 mb-2">
            {checklist.map((item, i) => (
              <div key={i} className="flex items-center gap-2 group">
                <div className="w-3 h-3 rounded-sm border border-sf-border/60 shrink-0" />
                <span className="flex-1 text-xs text-sf-text">{item}</span>
                <button
                  type="button"
                  onClick={() => setChecklist(p => p.filter((_, j) => j !== i))}
                  className="opacity-0 group-hover:opacity-100 text-sf-muted hover:text-sf-red transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="sf-input text-xs py-1.5 flex-1"
              placeholder="Add checklist item..."
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem() } }}
            />
            <button type="button" onClick={addItem} className="btn-ghost text-xs px-3 py-1.5">
              <Plus size={13} />
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button type="submit" disabled={loading || !form.title} className="btn-primary flex-1">
            {loading ? 'Adding...' : 'Add Topic'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
