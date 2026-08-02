import { useMemo, useState, useCallback, useEffect } from 'react'
import { ChevronRight, Folder, FolderOpen, Search } from 'lucide-react'
import { RawGraphData, RawFileNode } from '../types'
import { cn } from '../lib/utils'

interface Props {
  rawData: RawGraphData | null
  loading: boolean
  onFileSelect?: (fileId: string) => void
  selectedFileId?: string | null
}

type TreeNode = {
  name: string
  path: string
  kind: 'folder' | 'file'
  children: TreeNode[]
  file?: RawFileNode
}

function buildTree(nodes: RawFileNode[]): TreeNode {
  const root: TreeNode = { name: '', path: '', kind: 'folder', children: [] }
  const sorted = [...nodes].sort((a, b) => a.id.localeCompare(b.id))

  for (const file of sorted) {
    const parts = file.id.split('/')
    let cursor = root
    let acc = ''

    for (let i = 0; i < parts.length; i++) {
      const segment = parts[i]
      acc = acc ? `${acc}/${segment}` : segment
      const isLeaf = i === parts.length - 1

      if (isLeaf) {
        cursor.children.push({
          name: segment,
          path: file.id,
          kind: 'file',
          children: [],
          file
        })
      } else {
        let next = cursor.children.find(c => c.kind === 'folder' && c.name === segment)
        if (!next) {
          next = { name: segment, path: acc, kind: 'folder', children: [] }
          cursor.children.push(next)
        }
        cursor = next
      }
    }
  }

  const sortTree = (n: TreeNode) => {
    n.children.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    n.children.forEach(sortTree)
  }
  sortTree(root)
  return root
}

function extDot(name: string): string {
  if (name.endsWith('.tsx') || name.endsWith('.jsx')) return 'bg-sky-400'
  if (name.endsWith('.ts')) return 'bg-blue-400'
  if (name.endsWith('.js') || name.endsWith('.mjs')) return 'bg-amber-400'
  if (name.endsWith('.css') || name.endsWith('.scss')) return 'bg-pink-400'
  if (name.endsWith('.json')) return 'bg-lime-400'
  if (name.endsWith('.md')) return 'bg-zinc-400'
  return 'bg-zinc-500'
}

function matches(node: TreeNode, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  if (node.kind === 'file')
    return node.name.toLowerCase().includes(q) || node.path.toLowerCase().includes(q)
  return node.children.some(c => matches(c, q))
}

interface RowProps {
  node: TreeNode
  depth: number
  expanded: Set<string>
  toggle: (p: string) => void
  onFileSelect?: (id: string) => void
  selectedFileId?: string | null
  query: string
}

function Row({
  node,
  depth,
  expanded,
  toggle,
  onFileSelect,
  selectedFileId,
  query
}: RowProps) {
  if (!matches(node, query)) return null

  const isOpen = query ? true : expanded.has(node.path)
  const isSelected = node.kind === 'file' && selectedFileId === node.path
  const paddingLeft = 10 + depth * 14

  const base =
    'group flex w-full cursor-pointer select-none items-center gap-1.5 whitespace-nowrap py-1 pr-3 text-[12px] leading-5 transition-colors'

  if (node.kind === 'folder') {
    return (
      <>
        <div
          role="button"
          tabIndex={0}
          onClick={() => toggle(node.path)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              toggle(node.path)
            }
          }}
          className={cn(base, 'text-foreground/90 hover:bg-accent/60')}
          style={{ paddingLeft }}
        >
          <ChevronRight
            className={cn(
              'h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-150',
              isOpen && 'rotate-90'
            )}
          />
          {isOpen ? (
            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
          ) : (
            <Folder className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
          )}
          <span className="truncate font-medium">{node.name}</span>
        </div>
        {isOpen &&
          node.children.map(child => (
            <Row
              key={child.path}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              toggle={toggle}
              onFileSelect={onFileSelect}
              selectedFileId={selectedFileId}
              query={query}
            />
          ))}
      </>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onFileSelect?.(node.path)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onFileSelect?.(node.path)
        }
      }}
      className={cn(
        base,
        'border-l-2',
        isSelected
          ? 'border-foreground/70 bg-accent text-foreground'
          : 'border-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground'
      )}
      style={{ paddingLeft: paddingLeft - 2 }}
    >
      <span className="w-3 shrink-0" />
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-[2px]', extDot(node.name))} />
      <span className="truncate font-mono text-[11.5px]">{node.name}</span>
    </div>
  )
}

export function FileTree({ rawData, loading, onFileSelect, selectedFileId }: Props) {
  const tree = useMemo(() => (rawData ? buildTree(rawData.nodes) : null), [rawData])

  const defaultExpanded = useMemo(() => {
    const s = new Set<string>()
    if (!tree) return s
    for (const c of tree.children) if (c.kind === 'folder') s.add(c.path)
    return s
  }, [tree])

  const [expanded, setExpanded] = useState<Set<string>>(defaultExpanded)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (tree && expanded.size === 0) setExpanded(defaultExpanded)
  }, [tree, defaultExpanded, expanded.size])

  const toggle = useCallback((path: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  const fileCount = rawData?.nodes.length ?? 0

  return (
    <aside className="flex w-[280px] shrink-0 flex-col overflow-hidden border-r border-border bg-card">
      <div className="flex flex-col gap-2.5 border-b border-border px-3.5 pb-2.5 pt-3.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Explorer
          </span>
          <span className="ml-auto text-[10px] font-medium text-muted-foreground/70">
            {loading ? '—' : `${fileCount} files`}
          </span>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search files"
            className={cn(
              'h-8 w-full rounded-md border border-border bg-secondary pl-7 pr-2 text-[11.5px]',
              'text-foreground placeholder:text-muted-foreground',
              'focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/30'
            )}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto py-1.5">
        {loading && (
          <div className="px-4 py-3 text-[11px] text-muted-foreground">Loading tree…</div>
        )}
        {!loading && !tree && (
          <div className="px-4 py-3 text-[11px] text-muted-foreground">No files indexed</div>
        )}
        {!loading &&
          tree &&
          tree.children.map(child => (
            <Row
              key={child.path}
              node={child}
              depth={0}
              expanded={expanded}
              toggle={toggle}
              onFileSelect={onFileSelect}
              selectedFileId={selectedFileId}
              query={query.trim()}
            />
          ))}
      </div>
    </aside>
  )
}
