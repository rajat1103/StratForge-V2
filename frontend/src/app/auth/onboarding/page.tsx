'use client'
import React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, Zap, Plus, Trash2, Check, Rocket } from 'lucide-react'
import { cn } from '@/lib/utils'

const EXAM_TYPES = [
  { value: 'competitive', label: 'Competitive Exam', icon: '🏆', examples: 'JEE, UPSC, CAT, GMAT' },
  { value: 'university',  label: 'University Course', icon: '🎓', examples: 'Semester exams, finals' },
  { value: 'certification', label: 'Certification',   icon: '📜', examples: 'AWS, Azure, PMP, CFA' },
  { value: 'skill',       label: 'Skill Course',      icon: '💡', examples: 'Programming, Design' },
]

const THEMES = [
  { value: 'engineering', color: '#00D4FF', icon: '⚙️', label: 'Engineering' },
  { value: 'medical',     color: '#00FF9C', icon: '🏥', label: 'Medical' },
  { value: 'finance',     color: '#FFB347', icon: '📈', label: 'Finance' },
  { value: 'programming', color: '#FF6B6B', icon: '💻', label: 'Programming' },
  { value: 'minimal',     color: '#A0AEC0', icon: '📝', label: 'Minimal' },
  { value: 'default',     color: '#00D4FF', icon: '📚', label: 'General' },
]

const DEFAULT_TOPICS = [
  'Introduction & Fundamentals',
  'Core Concepts Part 1',
  'Core Concepts Part 2',
  'Advanced Topics',
  'Practice & Revision',
]

const STEPS = ['Welcome', 'Exam Setup', 'Add Topics', 'Ready!']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [exam, setExam] = useState({
    title: '',
    type: 'competitive',
    examDate: '',
    theme: 'default',
  })
  const [topics, setTopics] = useState(DEFAULT_TOPICS)
  const [newTopic, setNewTopic] = useState('')

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1))
  const back = () => setStep(s => Math.max(s - 1, 0))

  const addTopic = () => {
    if (newTopic.trim()) {
      setTopics(p => [...p, newTopic.trim()])
      setNewTopic('')
    }
  }

  const handleFinish = async () => {
    if (!exam.title.trim()) { setStep(1); return }
    setSaving(true)
    try {
      // Create exam
      const examRes = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exam),
      })
      const examData = await examRes.json()
      if (!examRes.ok) throw new Error(examData.error)

      // Create topics
      for (let i = 0; i < topics.length; i++) {
        await fetch('/api/topics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            examId: examData.data.id,
            title: topics[i],
            difficulty: 3,
            priority: topics.length - i > topics.length / 2 ? 4 : 3,
            estimatedDays: 3,
            order: i,
            checklistItems: [
              { label: 'Read theory & concepts', order: 0 },
              { label: 'Solve practice problems', order: 1 },
              { label: 'Take topic test', order: 2 },
            ],
          }),
        })
      }

      router.push('/dashboard')
    } catch (err) {
      console.error(err)
      setSaving(false)
    }
  }

  const selectedTheme = THEMES.find(t => t.value === exam.theme) || THEMES[5]

  return (
    <div className="min-h-screen bg-sf-bg bg-grid flex items-center justify-center p-4">
      <div className="fixed top-1/4 right-1/3 w-96 h-96 bg-sf-cyan/4 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <Zap size={18} className="text-sf-cyan" />
            <span className="font-display text-lg font-bold text-white tracking-wide">
              STRAT<span className="text-sf-cyan">FORGE</span>
            </span>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all',
                  i < step
                    ? 'bg-sf-cyan/20 border-sf-cyan text-sf-cyan'
                    : i === step
                    ? 'bg-sf-cyan text-sf-bg border-sf-cyan'
                    : 'border-sf-border/50 text-sf-muted'
                )}
              >
                {i < step ? <Check size={12} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('w-8 h-px', i < step ? 'bg-sf-cyan/40' : 'bg-sf-border/40')} />
              )}
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl border border-sf-border/60 p-7 shadow-panel">

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sf-cyan/20 to-sf-blue/20 border border-sf-cyan/20 flex items-center justify-center mx-auto">
                <Rocket size={28} className="text-sf-cyan" />
              </div>
              <h2 className="font-display text-2xl font-bold text-white">Welcome to StratForge!</h2>
              <p className="text-sf-muted text-sm leading-relaxed max-w-sm mx-auto">
                Let's set up your first exam in 2 minutes. You can add more exams and customise everything later.
              </p>
              <div className="grid grid-cols-3 gap-3 mt-4 text-left">
                {[
                  { icon: '🧠', title: 'AI Plans', desc: 'Auto-generated study roadmaps' },
                  { icon: '📊', title: 'Progress', desc: 'Track mastery per topic' },
                  { icon: '⚡', title: 'Insights', desc: 'Claude-powered advice' },
                ].map(f => (
                  <div key={f.title} className="glass-light rounded-xl p-3 border border-sf-border/40">
                    <span className="text-xl">{f.icon}</span>
                    <p className="text-xs font-semibold text-white mt-1">{f.title}</p>
                    <p className="text-xs text-sf-muted">{f.desc}</p>
                  </div>
                ))}
              </div>
              <button onClick={next} className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-2">
                Let's Get Started <ArrowRight size={15} />
              </button>
            </div>
          )}

          {/* Step 1: Exam setup */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold text-white">Set Up Your First Exam</h2>
                <p className="text-sf-muted text-sm mt-0.5">Tell us what you're preparing for</p>
              </div>

              <div>
                <label className="block text-xs text-sf-muted mb-1.5">Exam / Course Name *</label>
                <input
                  className="sf-input"
                  placeholder="e.g. JEE Advanced 2025, AWS Solutions Architect"
                  value={exam.title}
                  onChange={e => setExam(p => ({ ...p, title: e.target.value }))}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs text-sf-muted mb-2">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {EXAM_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setExam(p => ({ ...p, type: t.value }))}
                      className={cn(
                        'flex items-start gap-2 p-3 rounded-xl border text-left transition-all',
                        exam.type === t.value
                          ? 'bg-sf-cyan/10 border-sf-cyan/40'
                          : 'border-sf-border/50 hover:border-sf-border hover:bg-sf-panel/40'
                      )}
                    >
                      <span className="text-base mt-0.5">{t.icon}</span>
                      <div>
                        <p className={cn('text-xs font-semibold', exam.type === t.value ? 'text-sf-cyan' : 'text-white')}>
                          {t.label}
                        </p>
                        <p className="text-xs text-sf-muted">{t.examples}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-sf-muted mb-2">Theme</label>
                <div className="flex flex-wrap gap-2">
                  {THEMES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setExam(p => ({ ...p, theme: t.value }))}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all',
                        exam.theme === t.value ? 'text-white' : 'border-sf-border/40 text-sf-muted hover:text-sf-text'
                      )}
                      style={exam.theme === t.value
                        ? { borderColor: t.color, background: `${t.color}15`, color: t.color }
                        : {}}
                    >
                      <span>{t.icon}</span>{t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-sf-muted mb-1.5">Exam Date (optional)</label>
                <input
                  type="date"
                  className="sf-input"
                  value={exam.examDate}
                  onChange={e => setExam(p => ({ ...p, examDate: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={back} className="btn-ghost flex-1 flex items-center justify-center gap-1.5">
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={next}
                  disabled={!exam.title.trim()}
                  className="btn-primary flex-1 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  Next <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Topics */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-xl font-bold text-white">Add Your Topics</h2>
                <p className="text-sf-muted text-sm mt-0.5">
                  These are the subjects/chapters you need to cover. You can edit them anytime.
                </p>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {topics.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 group">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 font-bold"
                      style={{ background: `${selectedTheme.color}20`, color: selectedTheme.color }}
                    >
                      {i + 1}
                    </div>
                    <span className="flex-1 text-sm text-sf-text">{t}</span>
                    <button
                      onClick={() => setTopics(p => p.filter((_, j) => j !== i))}
                      className="opacity-0 group-hover:opacity-100 text-sf-muted hover:text-sf-red transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  className="sf-input text-sm py-2 flex-1"
                  placeholder="Add topic..."
                  value={newTopic}
                  onChange={e => setNewTopic(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTopic() } }}
                />
                <button onClick={addTopic} className="btn-ghost px-4">
                  <Plus size={15} />
                </button>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={back} className="btn-ghost flex-1 flex items-center justify-center gap-1.5">
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={next}
                  className="btn-primary flex-1 flex items-center justify-center gap-1.5"
                >
                  Next <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Ready */}
          {step === 3 && (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-sf-green/20 border border-sf-green/30 flex items-center justify-center mx-auto">
                <Check size={28} className="text-sf-green" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-white">Ready to Launch!</h2>
                <p className="text-sf-muted text-sm mt-1">Here's what we'll set up for you</p>
              </div>

              <div className="glass-light rounded-xl p-4 text-left space-y-2.5 border border-sf-border/40">
                <div className="flex items-center gap-2">
                  <span className="text-base">{selectedTheme.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{exam.title}</p>
                    <p className="text-xs text-sf-muted">{exam.type} · {selectedTheme.label} theme</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-sf-cyan/20 flex items-center justify-center">
                    <span className="text-xs text-sf-cyan font-bold">{topics.length}</span>
                  </div>
                  <span className="text-sm text-sf-muted">topics ready to track</span>
                </div>
              </div>

              <p className="text-xs text-sf-muted">
                After setup, go to your exam page to generate an AI study plan!
              </p>

              <div className="flex gap-3">
                <button onClick={back} className="btn-ghost flex-1">
                  <ArrowLeft size={14} className="inline mr-1" /> Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={saving}
                  className="btn-primary flex-2 flex-1 flex items-center justify-center gap-2 py-3"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Rocket size={15} /> Launch Dashboard
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
