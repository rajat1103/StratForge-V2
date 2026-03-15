'use client'
import React from 'react'
import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, RefreshCw, BookOpen, Zap, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const SUGGESTED = [
  { icon: TrendingUp, text: 'What topics should I focus on today?' },
  { icon: BookOpen,   text: 'Which topic has the lowest mastery?' },
  { icon: Zap,        text: 'Create a 2-hour study plan for today' },
  { icon: Sparkles,   text: 'Am I on track to finish before my exam?' },
]

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { data: examsData } = useQuery({
    queryKey: ['exams'],
    queryFn: () => fetch('/api/exams').then(r => r.json()),
  })
  const exams = examsData?.data || []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string = input) => {
    if (!text.trim() || streaming) return
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setStreaming(true)

    const assistantId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', timestamp: new Date() }])

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) throw new Error('Failed')
      const reader = res.body!.getReader()
      const dec = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += dec.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') continue
          try {
            const { text: chunk } = JSON.parse(payload)
            setMessages(prev =>
              prev.map(m => m.id === assistantId ? { ...m, content: m.content + chunk } : m)
            )
          } catch {}
        }
      }
    } catch {
      setMessages(prev =>
        prev.map(m => m.id === assistantId
          ? { ...m, content: 'Sorry, I ran into an issue. Please try again.' }
          : m
        )
      )
    } finally {
      setStreaming(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] animate-fade-in">
      {/* Header */}
      <div className="glass rounded-2xl border border-sf-border/50 p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sf-purple/30 to-sf-blue/30 border border-sf-purple/30 flex items-center justify-center">
            <Bot size={18} className="text-sf-purple" />
          </div>
          <div>
            <p className="font-display font-bold text-white text-sm">StratForge AI</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-sf-green animate-pulse" />
              <p className="text-xs text-sf-muted">
                Aware of {exams.length} exam{exams.length !== 1 ? 's' : ''} · Powered by Claude
              </p>
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-sf-muted hover:text-sf-cyan transition-colors"
            title="Clear chat"
          >
            <RefreshCw size={14} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center pb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sf-purple/20 to-sf-blue/20 border border-sf-purple/20 flex items-center justify-center mb-4">
              <Sparkles size={28} className="text-sf-purple" />
            </div>
            <p className="font-display text-xl font-bold text-white mb-2">How can I help you study?</p>
            <p className="text-sf-muted text-sm mb-8 max-w-sm">
              I know your exams, topics, and progress. Ask me anything about your preparation.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTED.map(({ icon: Icon, text }) => (
                <button
                  key={text}
                  onClick={() => sendMessage(text)}
                  className="glass-light rounded-xl px-4 py-3 text-left text-sm text-sf-muted hover:text-sf-text border border-sf-border/40 hover:border-sf-cyan/30 hover:bg-sf-cyan/5 transition-all flex items-start gap-2 group"
                >
                  <Icon size={14} className="text-sf-cyan mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                  <span>{text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={cn('flex items-start gap-3', msg.role === 'user' && 'flex-row-reverse')}
            >
              {/* Avatar */}
              <div
                className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border',
                  msg.role === 'assistant'
                    ? 'bg-sf-purple/20 border-sf-purple/30'
                    : 'bg-sf-cyan/20 border-sf-cyan/30'
                )}
              >
                {msg.role === 'assistant'
                  ? <Bot size={14} className="text-sf-purple" />
                  : <User size={14} className="text-sf-cyan" />
                }
              </div>

              {/* Bubble */}
              <div className={cn('max-w-[80%] space-y-1', msg.role === 'user' && 'items-end flex flex-col')}>
                <div
                  className={cn(
                    'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                    msg.role === 'assistant'
                      ? 'glass border border-sf-border/50 text-sf-text prose-sf rounded-tl-none'
                      : 'bg-sf-cyan/15 border border-sf-cyan/25 text-white rounded-tr-none'
                  )}
                >
                  {msg.role === 'assistant' && msg.content === '' ? (
                    <span className="text-sf-muted typing-cursor" />
                  ) : (
                    <div
                      className={msg.role === 'assistant' ? 'prose-sf' : ''}
                      dangerouslySetInnerHTML={
                        msg.role === 'assistant'
                          ? { __html: formatMarkdown(msg.content) }
                          : undefined
                      }
                    >
                      {msg.role === 'user' ? msg.content : undefined}
                    </div>
                  )}
                  {msg.role === 'assistant' && streaming && msg === messages[messages.length - 1] && msg.content && (
                    <span className="inline-block w-0.5 h-4 bg-sf-cyan ml-0.5 animate-pulse align-middle" />
                  )}
                </div>
                <p className="text-xs text-sf-muted px-1">
                  {format(msg.timestamp, 'HH:mm')}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="glass rounded-2xl border border-sf-border/50 p-3 focus-within:border-sf-cyan/30 transition-colors">
        <div className="flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your study plan, weak topics, schedule..."
            rows={1}
            className="flex-1 bg-transparent text-sf-text text-sm placeholder:text-sf-muted resize-none outline-none leading-relaxed max-h-32 overflow-y-auto"
            style={{ minHeight: 24 }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || streaming}
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0',
              input.trim() && !streaming
                ? 'bg-sf-cyan text-sf-bg hover:opacity-90'
                : 'bg-sf-panel text-sf-muted cursor-not-allowed'
            )}
          >
            {streaming
              ? <div className="w-3.5 h-3.5 border-2 border-sf-muted border-t-transparent rounded-full animate-spin" />
              : <Send size={15} />
            }
          </button>
        </div>
        <p className="text-xs text-sf-muted mt-2 pl-0.5">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}

function formatMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul])/gm, '')
}
