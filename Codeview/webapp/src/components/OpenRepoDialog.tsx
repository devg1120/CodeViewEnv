import { useState, useEffect, useRef, useCallback } from 'react'
import { GitFork, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '../lib/utils'

const SERVER = 'http://localhost:3001'
const POLL_MS = 1200

type CloneStatus = 'idle' | 'cloning' | 'ready' | 'error'

interface CloneState {
  status: CloneStatus
  message: string
  repoUrl: string
}

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const EXAMPLES = [
  'facebook/react',
  'vercel/next.js',
  'vitejs/vite'
]

export function OpenRepoDialog({ open, onClose, onSuccess }: Props) {
  const [url, setUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [cloneState, setCloneState] = useState<CloneState>({
    status: 'idle',
    message: '',
    repoUrl: ''
  })
  const [error, setError] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setUrl('')
      setError('')
      setSubmitting(false)
      setCloneState({ status: 'idle', message: '', repoUrl: '' })
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      stopPolling()
    }
  }, [open, stopPolling])

  // Poll /clone/status while cloning
  useEffect(() => {
    if (cloneState.status !== 'cloning') {
      stopPolling()
      return
    }
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${SERVER}/clone/status`)
        const data: CloneState = await res.json()
        setCloneState(data)
        if (data.status === 'ready') {
          stopPolling()
          setSubmitting(false)
          setTimeout(() => {
            onSuccess()
            onClose()
          }, 800)
        } else if (data.status === 'error') {
          stopPolling()
          setSubmitting(false)
          setError(data.message || 'Clone failed')
        }
      } catch {
        // server unreachable — keep polling
      }
    }, POLL_MS)
    return stopPolling
  }, [cloneState.status, stopPolling, onSuccess, onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return

    setError('')
    setSubmitting(true)
    setCloneState({ status: 'idle', message: '', repoUrl: '' })

    try {
      const res = await fetch(`${SERVER}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Request failed')
        setSubmitting(false)
        return
      }
      // Server accepted — start polling
      setCloneState({ status: 'cloning', message: 'Cloning…', repoUrl: trimmed })
    } catch {
      setError('Cannot reach server at localhost:3001')
      setSubmitting(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onClose()
  }

  if (!open) return null

  const isCloning = cloneState.status === 'cloning'
  const isReady = cloneState.status === 'ready'
  const busy = submitting || isCloning

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal
        aria-label="Open GitHub repository"
        className={cn(
          'fixed left-1/2 top-[28%] z-50 w-full max-w-[520px] -translate-x-1/2 -translate-y-1/2',
          'rounded-xl border border-border bg-card shadow-2xl',
          'animate-fade-in'
        )}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-secondary">
            <GitFork className="h-4 w-4 text-foreground/80" />
          </span>
          <div>
            <div className="text-[13px] font-semibold text-foreground">Open GitHub Repository</div>
            <div className="text-[11px] text-muted-foreground">
              Clones the repo and analyzes its architecture
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label
                htmlFor="repo-url"
                className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
              >
                Repository URL or shorthand
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground">
                  github.com/
                </span>
                <input
                  id="repo-url"
                  ref={inputRef}
                  value={url}
                  onChange={e => { setUrl(e.target.value); setError('') }}
                  placeholder="owner/repo"
                  disabled={busy}
                  autoComplete="off"
                  className={cn(
                    'h-10 w-full rounded-md border bg-secondary py-2 pl-[88px] pr-3 text-[13px]',
                    'text-foreground placeholder:text-muted-foreground',
                    'focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/30',
                    'disabled:cursor-not-allowed disabled:opacity-60',
                    error ? 'border-destructive' : 'border-border'
                  )}
                />
              </div>
              {error && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-destructive">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {error}
                </div>
              )}
            </div>

            {/* Examples */}
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] text-muted-foreground">Examples:</span>
              {EXAMPLES.map(ex => (
                <button
                  key={ex}
                  type="button"
                  disabled={busy}
                  onClick={() => setUrl(ex)}
                  className={cn(
                    'rounded border border-border bg-secondary px-2 py-0.5 font-mono text-[10.5px]',
                    'text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                    'disabled:pointer-events-none disabled:opacity-50'
                  )}
                >
                  {ex}
                </button>
              ))}
            </div>

            {/* Clone progress */}
            {(isCloning || isReady) && (
              <div
                className={cn(
                  'flex items-center gap-2.5 rounded-md border px-3 py-2.5 text-[12px]',
                  isReady
                    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                    : 'border-border bg-secondary text-muted-foreground'
                )}
              >
                {isReady ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                )}
                <span>{isReady ? 'Repository loaded — opening…' : cloneState.message || 'Cloning repository…'}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className={cn(
                  'h-9 rounded-md border border-border bg-secondary px-4 text-[12px] font-medium',
                  'text-foreground/80 transition-colors hover:bg-accent hover:text-foreground',
                  'disabled:pointer-events-none disabled:opacity-50'
                )}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy || !url.trim()}
                className={cn(
                  'flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-[12px] font-medium',
                  'text-primary-foreground transition-opacity hover:opacity-90',
                  'disabled:cursor-not-allowed disabled:opacity-40'
                )}
              >
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isCloning ? 'Cloning…' : 'Open repository'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
