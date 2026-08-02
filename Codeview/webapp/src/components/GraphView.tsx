import { useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Loader2, Plug, LayoutGrid } from 'lucide-react'
import { FolderNode } from './FolderNode'
import { FileNode } from './FileNode'
import { cn } from '../lib/utils'

const nodeTypes: NodeTypes = {
  folderNode: FolderNode,
  fileNode: FileNode
}

interface Props {
  nodes: Node[]
  edges: Edge[]
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
  loading: boolean
  error: string | null
  onResetLayout?: () => void
}

/**
 * Rendered inside <ReactFlow> so it has access to the ReactFlow context
 * and can call fitView() after the parent restores default positions.
 */
const EDGE_LEGEND: { label: string; color: string; dash?: string; hint: string }[] = [
  { label: 'Import', color: '#6366f1', hint: 'Source file imports the target' },
  { label: 'Call', color: '#f59e0b', dash: '6 3', hint: 'Source calls a function defined in the target' },
  {
    label: 'Renders',
    color: '#10b981',
    dash: '2 5',
    hint: 'Source component renders the target (JSX)'
  }
]

function LegendArrow({ color, dash }: { color: string; dash?: string }) {
  const markerId = `legend-arrow-${color.replace('#', '')}`
  return (
    <svg width="30" height="8" viewBox="0 0 30 8" className="shrink-0">
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
        </marker>
      </defs>
      <line
        x1="0"
        y1="4"
        x2="24"
        y2="4"
        stroke={color}
        strokeWidth="2"
        strokeDasharray={dash}
        strokeLinecap="round"
        markerEnd={`url(#${markerId})`}
      />
    </svg>
  )
}

function EdgeLegend() {
  return (
    <div
      className={cn(
        'pointer-events-auto absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3',
        'rounded-md border border-border bg-card/85 px-3 py-2 shadow-sm backdrop-blur-sm'
      )}
    >
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Edges
        </span>
        <span className="text-[9.5px] text-muted-foreground/80">source → target</span>
      </div>
      <span className="h-6 w-px bg-border" />
      <div className="flex items-center gap-3">
        {EDGE_LEGEND.map(item => (
          <div
            key={item.label}
            title={item.hint}
            className="flex items-center gap-1.5 text-[11px] text-foreground/85"
          >
            <LegendArrow color={item.color} dash={item.dash} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}

function ResetLayoutButton({ onResetLayout }: { onResetLayout?: () => void }) {
  const { fitView } = useReactFlow()

  const handleClick = useCallback(() => {
    onResetLayout?.()
    // Let React commit the new positions, then smoothly re-fit.
    requestAnimationFrame(() => {
      fitView({ padding: 0.08, duration: 400 })
    })
  }, [fitView, onResetLayout])

  if (!onResetLayout) return null

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Reset layout"
      className={cn(
        'absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-md',
        'border border-border bg-card/90 px-2.5 py-1.5 text-[11.5px] font-medium',
        'text-foreground/85 shadow-sm backdrop-blur-sm transition-colors',
        'hover:bg-accent hover:text-foreground',
        'active:scale-[0.98]'
      )}
    >
      <LayoutGrid className="h-3.5 w-3.5" />
      Reset layout
    </button>
  )
}

export function GraphView({
  nodes,
  edges,
  setNodes,
  setEdges,
  loading,
  error,
  onResetLayout
}: Props) {
  const onNodesChange: OnNodesChange = useCallback(
    changes => setNodes(nds => applyNodeChanges(changes, nds)),
    [setNodes]
  )
  const onEdgesChange: OnEdgesChange = useCallback(
    changes => setEdges(eds => applyEdgeChanges(changes, eds)),
    [setEdges]
  )

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <div className="text-[12px] text-muted-foreground">Connecting to server…</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background px-6">
        <div className="max-w-[380px] text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary">
            <Plug className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mb-2 text-[13px] text-foreground">{error}</div>
          <div className="text-[11px] text-muted-foreground">
            Open VS Code → <code className="rounded bg-secondary px-1 py-0.5 font-mono text-foreground/80">Cmd+Shift+P</code> →{' '}
            <code className="rounded bg-secondary px-1 py-0.5 font-mono text-foreground/80">CodeSight: Start Visualizer</code>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex-1 bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.08 }}
        minZoom={0.15}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="rgba(255,255,255,0.05)" gap={28} size={1} />
        <Controls />
        <MiniMap
          nodeColor={n => (n.type === 'folderNode' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.55)')}
          maskColor="rgba(10, 10, 12, 0.78)"
        />
        <ResetLayoutButton onResetLayout={onResetLayout} />
        <EdgeLegend />
      </ReactFlow>
    </div>
  )
}
