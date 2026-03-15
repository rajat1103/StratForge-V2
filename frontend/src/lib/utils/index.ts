import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, differenceInDays } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, fmt = 'MMM d, yyyy') {
  return format(new Date(date), fmt)
}

export function formatRelative(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function daysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null
  return Math.max(0, differenceInDays(new Date(date), new Date()))
}

export function getMasteryLabel(level: number): string {
  if (level >= 0.9) return 'Expert'
  if (level >= 0.7) return 'Proficient'
  if (level >= 0.5) return 'Intermediate'
  if (level >= 0.3) return 'Beginner'
  return 'Not Started'
}

export function getMasteryColor(level: number): string {
  if (level >= 0.9) return '#00FF9C'
  if (level >= 0.7) return '#00D4FF'
  if (level >= 0.5) return '#FFB347'
  if (level >= 0.3) return '#FF6B6B'
  return '#4A5568'
}

export function getDifficultyLabel(difficulty: number): string {
  const labels = ['', 'Very Easy', 'Easy', 'Medium', 'Hard', 'Expert']
  return labels[difficulty] || 'Unknown'
}

export function getPriorityLabel(priority: number): string {
  const labels = ['', 'Low', 'Normal', 'Important', 'High', 'Critical']
  return labels[priority] || 'Unknown'
}

export function getPriorityColor(priority: number): string {
  const colors = ['', '#4A5568', '#718096', '#FFB347', '#FF6B6B', '#FF0066']
  return colors[priority] || '#4A5568'
}

export function calculateExamReadiness(topics: Array<{ masteryLevel: number; priority: number }>): number {
  if (topics.length === 0) return 0
  const weighted = topics.reduce((sum, t) => sum + t.masteryLevel * t.priority, 0)
  const maxWeight = topics.reduce((sum, t) => sum + t.priority, 0)
  return Math.round((weighted / maxWeight) * 100)
}

export function getThemeConfig(theme: string) {
  const themes: Record<string, { primary: string; secondary: string; label: string; icon: string }> = {
    engineering: { primary: '#00D4FF', secondary: '#0066FF', label: 'Engineering', icon: '⚙️' },
    medical: { primary: '#00FF9C', secondary: '#00CC7A', label: 'Medical', icon: '🏥' },
    finance: { primary: '#FFB347', secondary: '#FF8C00', label: 'Finance', icon: '📈' },
    programming: { primary: '#FF6B6B', secondary: '#FF0066', label: 'Programming', icon: '💻' },
    minimal: { primary: '#A0AEC0', secondary: '#718096', label: 'Minimal', icon: '📝' },
    default: { primary: '#00D4FF', secondary: '#0066FF', label: 'General', icon: '📚' },
  }
  return themes[theme] || themes.default
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function getStatusBadgeStyle(status: string) {
  const styles: Record<string, string> = {
    completed: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    in_progress: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
    not_started: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
    needs_revision: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    active: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
    paused: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  }
  return styles[status] || styles.not_started
}

export function groupByDate<T extends { logDate?: Date; scheduledDate?: Date }>(
  items: T[]
): Record<string, T[]> {
  return items.reduce((groups, item) => {
    const date = item.logDate || item.scheduledDate
    if (!date) return groups
    const key = format(new Date(date), 'yyyy-MM-dd')
    return { ...groups, [key]: [...(groups[key] || []), item] }
  }, {} as Record<string, T[]>)
}
