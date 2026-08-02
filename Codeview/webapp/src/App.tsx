import { useCallback, useEffect, useRef, useState } from 'react'
import { Node, Edge } from '@xyflow/react'
import { GitFork } from 'lucide-react'
import { useGraphData } from './hooks/useGraphData'
import { GraphView } from './components/GraphView'
import { ChatPanel } from './components/ChatPanel'
import { FileTree } from './components/FileTree'
import { OpenRepoDialog } from './components/OpenRepoDialog'
import { buildReactFlowGraph } from './lib/layoutGraph'
import { cn } from './lib/utils'

function Logo() {
  return (
    <div
      className={cn(
        'relative flex h-7 w-7 items-center justify-center rounded-md',
        'bg-gradient-to-br from-zinc-100 to-zinc-300',
        'shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_4px_12px_rgba(0,0,0,0.35)]',
        'ring-1 ring-black/50'
      )}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 1.5L14 5V11L8 14.5L2 11V5L8 1.5Z"
          stroke="#0a0a0a"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <circle cx="8" cy="8" r="1.8" fill="#0a0a0a" />
      </svg>
    </div>
  )
}

export default function App() {
  const { rawData, loading, error, refetch } = useGraphData()

  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [repoDialogOpen, setRepoDialogOpen] = useState(false)

  const toggleFolder = useCallback((folderKey: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderKey)) next.delete(folderKey)
      else next.add(folderKey)
      return next
    })
  }, [])

  // Rebuild graph when data or expanded set changes.
  // Skip rebuild when polled rawData is identical (same node/edge count).
  const prevDataSig = useRef('')
  useEffect(() => {
    if (!rawData) return
    const sig = `${rawData.nodes.length}:${rawData.edges.length}:${[...expandedFolders].sort().join(',')}`
    if (sig === prevDataSig.current) return
    prevDataSig.current = sig
    const { nodes: n, edges: e } = buildReactFlowGraph(rawData, expandedFolders, toggleFolder)
    setNodes(n)
    setEdges(e)
  }, [rawData, expandedFolders, toggleFolder])

  const resetLayout = useCallback(() => {
    setExpandedFolders(new Set())
  }, [])

  const handleHighlight = useCallback(
    (nodeIds: string[], reasoning: Record<string, string>) => {
      const fileSet = new Set(nodeIds)
      const hasHighlight = fileSet.size > 0

      // Also highlight the collapsed folder card when it contains a relevant file
      const folderSet = new Set<string>()
      if (hasHighlight && rawData) {
        for (const n of rawData.nodes) {
          if (fileSet.has(n.id)) {
            folderSet.add(`folder:${n.folder || '(root)'}`)
          }
        }
      }

      setNodes(nds =>
        nds.map(n => {
          const isHighlighted = fileSet.has(n.id) || folderSet.has(n.id)
          return {
            ...n,
            data: {
              ...n.data,
              highlighted: isHighlighted,
              dimmed: hasHighlight && !isHighlighted,
              highlightReason: reasoning[n.id] ?? undefined
            }
          }
        })
      )

      // Animate edges between highlighted nodes; dim everything else
      setEdges(eds =>
        eds.map(e => {
          const edgeType = (e.data as { edgeType?: string } | undefined)?.edgeType ?? 'import'
          const isCall = edgeType === 'call'
          const isRenders = edgeType === 'renders'
          const baseColor = isRenders ? '#10b981' : isCall ? '#f59e0b' : '#6366f1'
          const baseOpacity = isRenders || isCall ? 0.45 : 0.55

          if (!hasHighlight) {
            return { ...e, animated: false, style: { stroke: baseColor, strokeWidth: 1.5, opacity: baseOpacity } }
          }

          const srcHL = fileSet.has(e.source) || folderSet.has(e.source)
          const tgtHL = fileSet.has(e.target) || folderSet.has(e.target)

          if (srcHL && tgtHL) {
            return { ...e, animated: true, style: { stroke: '#f59e0b', strokeWidth: 2.5, opacity: 0.95 } }
          }
          if (srcHL || tgtHL) {
            return { ...e, animated: false, style: { stroke: baseColor, strokeWidth: 1.5, opacity: 0.25 } }
          }
          return { ...e, animated: false, style: { stroke: baseColor, strokeWidth: 1.5, opacity: 0.05 } }
        })
      )
    },
    [rawData, setEdges]
  )

  const handleFileSelect = useCallback(
    (fileId: string) => {
      setSelectedFileId(fileId)
      handleHighlight([fileId], {})
    },
    [handleHighlight]
  )

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header
        className={cn(
          'flex h-[52px] flex-shrink-0 items-center gap-3 border-b border-border px-5',
          'bg-gradient-to-b from-white/[0.02] to-transparent backdrop-blur-md'
        )}
      >
        <Logo />

        <div className="flex items-baseline gap-3">
          <span className="text-[17px] font-semibold tracking-tight text-foreground">
            CodeSight
          </span>
          <span className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            AI Architecture Explorer
          </span>
        </div>

        <div className="ml-auto">
          <button
            type="button"
            onClick={() => setRepoDialogOpen(true)}
            className={cn(
              'inline-flex items-center gap-2 rounded-md border border-border bg-secondary',
              'px-3 py-1.5 text-[12px] font-medium text-foreground/85',
              'transition-colors hover:bg-accent hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
            )}
          >
            <GitFork className="h-3.5 w-3.5" />
            Open GitHub repo
          </button>
        </div>
      </header>

      <OpenRepoDialog
        open={repoDialogOpen}
        onClose={() => setRepoDialogOpen(false)}
        onSuccess={() => {
          setSelectedFileId(null)
          setExpandedFolders(new Set())
          refetch()
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        <FileTree
          rawData={rawData}
          loading={loading}
          onFileSelect={handleFileSelect}
          selectedFileId={selectedFileId}
        />
        <GraphView
          nodes={nodes}
          edges={edges}
          setNodes={setNodes}
          setEdges={setEdges}
          loading={loading}
          error={error}
          onResetLayout={resetLayout}
        />
        <ChatPanel rawData={rawData} onHighlight={handleHighlight} />
      </div>
    </div>
  )
}
