import { Node, Edge, MarkerType } from '@xyflow/react'
import { RawGraphData, RawFileNode } from '../types'

const FILE_W = 240
const FILE_H = 180
const FILE_V_GAP = 12
const FILE_H_GAP = 16
const FOLDER_PAD = 20
const FOLDER_HEADER = 44

export const COLLAPSED_W = 220
export const COLLAPSED_H = 72

const CELL_H_GAP = 60   // horizontal gap between folder cards
const CELL_V_GAP = 50   // vertical gap between rows

// ── Folder hue (stable per top-level package) ────────────────────────────────

function strHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function folderHue(folderPath: string): number {
  const parts = folderPath.split('/')
  const key =
    parts[0] === 'packages' || parts[0] === 'apps' || parts[0] === 'libs'
      ? `${parts[0]}/${parts[1] ?? ''}`
      : parts[0] || folderPath
  return strHash(key) % 360
}

// ── Grid sizing for expanded folders ─────────────────────────────────────────

function gridCols(n: number): number {
  if (n <= 4) return 1
  if (n <= 15) return 2
  return 3
}

function expandedSize(fileCount: number): { w: number; h: number } {
  const cols = gridCols(fileCount)
  const rows = Math.ceil(fileCount / cols)
  const w = cols * FILE_W + (cols + 1) * FOLDER_PAD
  const h =
    FOLDER_HEADER +
    FOLDER_PAD +
    rows * FILE_H +
    Math.max(0, rows - 1) * FILE_V_GAP +
    FOLDER_PAD
  return { w, h }
}

// ── Fixed grid layout — no simulation, no overlap, instant ───────────────────
// Folders are sorted so same-package folders are adjacent, then arranged
// left-to-right in rows. Column width = widest node; row height = tallest node
// in that row.

function gridLayout(
  nodeList: { id: string; w: number; h: number }[]
): Map<string, { x: number; y: number }> {
  const n = nodeList.length
  if (n === 0) return new Map()
  if (n === 1) return new Map([[nodeList[0].id, { x: 0, y: 0 }]])

  // Number of columns: roughly square, slightly wider
  const COLS = Math.max(1, Math.round(Math.sqrt(n * 1.6)))

  // Column width = widest node across entire list (uniform columns)
  const colW = Math.max(...nodeList.map(nd => nd.w))

  // Row heights: each row is as tall as its tallest node
  const numRows = Math.ceil(n / COLS)
  const rowH: number[] = []
  for (let r = 0; r < numRows; r++) {
    let maxH = 0
    for (let c = 0; c < COLS; c++) {
      const idx = r * COLS + c
      if (idx < n) maxH = Math.max(maxH, nodeList[idx].h)
    }
    rowH.push(maxH)
  }

  // Cumulative row y offsets
  const rowY: number[] = [0]
  for (let r = 0; r < numRows - 1; r++) {
    rowY.push(rowY[r] + rowH[r] + CELL_V_GAP)
  }

  const positions = new Map<string, { x: number; y: number }>()
  for (let i = 0; i < n; i++) {
    const col = i % COLS
    const row = Math.floor(i / COLS)
    positions.set(nodeList[i].id, {
      x: col * (colW + CELL_H_GAP),
      y: rowY[row]
    })
  }

  return positions
}

// Sort key: group by top-level package so related folders sit next to each other
function folderSortKey(folder: string): string {
  const parts = folder.split('/')
  const pkg =
    parts[0] === 'packages' || parts[0] === 'apps' || parts[0] === 'libs'
      ? `${parts[1] ?? ''}/${parts.slice(2).join('/')}`
      : folder
  return pkg
}

// ── Main graph builder ────────────────────────────────────────────────────────

export function buildReactFlowGraph(
  raw: RawGraphData,
  expandedFolders: Set<string>,
  onToggleFolder: (folderKey: string) => void
): { nodes: Node[]; edges: Edge[] } {
  // Group files by folder
  const folderMap = new Map<string, RawFileNode[]>()
  for (const file of raw.nodes) {
    const key = file.folder || '(root)'
    if (!folderMap.has(key)) folderMap.set(key, [])
    folderMap.get(key)!.push(file)
  }

  // Sort folders: same-package folders are adjacent
  const sortedFolders = [...folderMap.entries()].sort(([a], [b]) =>
    folderSortKey(a).localeCompare(folderSortKey(b))
  )

  const fileToFolder = new Map<string, string>()
  for (const file of raw.nodes) {
    fileToFolder.set(file.id, file.folder || '(root)')
  }

  // Build node list for the grid (same order as sortedFolders)
  const folderNodeList = sortedFolders.map(([folder, files]) => {
    const { w, h } = expandedFolders.has(folder)
      ? expandedSize(files.length)
      : { w: COLLAPSED_W, h: COLLAPSED_H }
    return { id: folder, w, h }
  })

  const positions = gridLayout(folderNodeList)

  // Build React Flow nodes
  const nodes: Node[] = []
  const edges: Edge[] = []

  for (const [folder, files] of sortedFolders) {
    const pos = positions.get(folder) ?? { x: 0, y: 0 }
    const isExpanded = expandedFolders.has(folder)
    const { w, h } = isExpanded ? expandedSize(files.length) : { w: COLLAPSED_W, h: COLLAPSED_H }
    const folderId = `folder:${folder}`
    const hue = folderHue(folder)

    nodes.push({
      id: folderId,
      type: 'folderNode',
      position: { x: pos.x, y: pos.y },
      data: {
        label: folder,
        path: folder,
        folderKey: folder,
        fileCount: files.length,
        expanded: isExpanded,
        onToggle: onToggleFolder,
        hue
      },
      style: { width: w, height: h },
      draggable: true
    })

    if (isExpanded) {
      const cols = gridCols(files.length)
      files.forEach((file, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)
        nodes.push({
          id: file.id,
          type: 'fileNode',
          parentId: folderId,
          position: {
            x: FOLDER_PAD + col * (FILE_W + FILE_H_GAP),
            y: FOLDER_HEADER + FOLDER_PAD + row * (FILE_H + FILE_V_GAP)
          },
          data: { label: file.label, path: file.id, content: file.content, size: file.size },
          width: FILE_W,
          height: FILE_H,
          draggable: true
        })
      })
    }
  }

  // Resolve edge endpoint to folder node if collapsed, file node if expanded
  function resolveNode(fileId: string): string {
    const folder = fileToFolder.get(fileId) ?? '(root)'
    return expandedFolders.has(folder) ? fileId : `folder:${folder}`
  }

  const nodeIds = new Set(nodes.map(nd => nd.id))
  const edgeKeySet = new Set<string>()

  for (const e of raw.edges) {
    const srcNode = resolveNode(e.source)
    const tgtNode = resolveNode(e.target)
    if (srcNode === tgtNode) continue
    if (!nodeIds.has(srcNode) || !nodeIds.has(tgtNode)) continue

    const edgeKey = `${e.type}:${srcNode}→${tgtNode}`
    if (edgeKeySet.has(edgeKey)) continue
    edgeKeySet.add(edgeKey)

    const isCall = e.type === 'call'
    const isRenders = e.type === 'renders'
    const color = isRenders ? '#10b981' : isCall ? '#f59e0b' : '#6366f1'
    const style = isRenders
      ? { stroke: color, strokeWidth: 1.5, opacity: 0.45, strokeDasharray: '2 5' }
      : isCall
      ? { stroke: color, strokeWidth: 1.5, opacity: 0.45, strokeDasharray: '6 3' }
      : { stroke: color, strokeWidth: 1.5, opacity: 0.55 }

    edges.push({
      id: edgeKey,
      source: srcNode,
      target: tgtNode,
      type: 'smoothstep',
      data: { edgeType: e.type, label: e.label },
      style,
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 12, height: 12 }
    })
  }

  return { nodes, edges }
}
