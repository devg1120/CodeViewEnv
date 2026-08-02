import { useState, useRef, useEffect } from 'react'
import { Sparkles, ArrowUp } from 'lucide-react'
import { ChatMessage, RawGraphData } from '../types'
import { askAboutCodebase } from '../lib/llm'
import { skeletonizeNodes } from '../lib/skeletonize'
import { cn } from '../lib/utils'

interface Props {
  rawData: RawGraphData | null
  onHighlight: (nodeIds: string[], reasoning: Record<string, string>) => void
}

const SUGGESTIONS = [
  'Which files handle auth?',
  'What does the db layer do?',
  'How does data flow through the app?'
]

export function ChatPanel({ rawData, onHighlight }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const q = input.trim()
    if (!q || busy || !rawData) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    onHighlight([], {})   // clear previous highlights while thinking
    setBusy(true)

    try {
      const skeleton = skeletonizeNodes(rawData.nodes)
      const res = await askAboutCodebase(q, skeleton)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: res.answer,
          highlightedNodes: res.highlightNodes
        }
      ])
      if (res.highlightNodes.length > 0) onHighlight(res.highlightNodes, res.reasoning)
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Gemini error: ${err instanceof Error ? err.message : String(err)}`
        }
      ])
    } finally {
      setBusy(false)
    }
  }

  const disabled = !rawData || busy || !input.trim()

  return (
    <aside className="flex w-[360px] shrink-0 flex-col border-l border-border bg-card">
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-secondary">
          <Sparkles className="h-3 w-3 text-foreground/80" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          AI Chat
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-auto p-4">
        {messages.length === 0 && (
          <div className="mt-6 flex flex-col items-stretch gap-3 px-1 text-center">
            <div className="text-[13px] font-medium text-foreground/80">
              Ask anything about your codebase
            </div>
            <div className="flex flex-col gap-1.5">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setInput(s)}
                  className={cn(
                    'rounded-md border border-border bg-secondary px-3 py-2 text-left',
                    'text-[11.5px] text-muted-foreground transition-colors',
                    'hover:border-border/80 hover:bg-accent hover:text-foreground'
                  )}
                >
                  “{s}”
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              'flex animate-fade-in flex-col',
              msg.role === 'user' ? 'items-end' : 'items-start'
            )}
          >
            <div
              className={cn(
                'max-w-[90%] px-3 py-2 text-[12px] leading-relaxed',
                msg.role === 'user'
                  ? 'rounded-[12px_12px_3px_12px] bg-primary text-primary-foreground'
                  : 'rounded-[12px_12px_12px_3px] border border-border bg-secondary text-foreground'
              )}
            >
              {msg.content}
            </div>

            {msg.highlightedNodes && msg.highlightedNodes.length > 0 && (
              <div className="mt-1.5 flex max-w-[90%] flex-wrap gap-1">
                {msg.highlightedNodes.map(id => (
                  <span
                    key={id}
                    className="rounded border border-border bg-accent/60 px-1.5 py-[1px] font-mono text-[10px] text-foreground/80"
                  >
                    {id.split('/').pop()}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {busy && (
          <div className="flex items-center gap-2 self-start rounded-[12px_12px_12px_3px] border border-border bg-secondary px-3 py-2 text-[12px] text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 animate-pulse-dot rounded-full bg-foreground/70" />
            Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="flex gap-2 border-t border-border bg-white/[0.01] p-3">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={rawData ? 'Ask about this codebase…' : 'Waiting for server…'}
          disabled={!rawData || busy}
          className={cn(
            'h-9 flex-1 rounded-md border border-border bg-secondary px-3 text-[12px]',
            'text-foreground placeholder:text-muted-foreground',
            'focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/30',
            'disabled:cursor-not-allowed disabled:opacity-60'
          )}
        />
        <button
          type="submit"
          disabled={disabled}
          className={cn(
            'flex h-9 min-w-[38px] items-center justify-center rounded-md px-3',
            'bg-primary text-primary-foreground transition-opacity',
            'hover:opacity-90 active:scale-[0.97]',
            'disabled:cursor-not-allowed disabled:opacity-40'
          )}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </form>
    </aside>
  )
}
