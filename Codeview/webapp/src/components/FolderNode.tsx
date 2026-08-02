import { memo } from 'react'
import { NodeProps, Handle, Position } from '@xyflow/react'
import { ChevronRight, ChevronDown } from 'lucide-react'

interface FolderData {
  label: string
  path: string
  folderKey: string
  fileCount: number
  expanded: boolean
  onToggle: (key: string) => void
  hue: number
  highlighted?: boolean
  dimmed?: boolean
  aiSummary?: string
}

export const FolderNode = memo(({ data, selected }: NodeProps) => {
  const d = data as unknown as FolderData
  const name = d.label.split('/').filter(Boolean).pop() ?? d.label
  const parentPath = d.label.includes('/')
    ? d.label.split('/').slice(0, -1).join('/')
    : null

  const h = d.hue
  const hi = d.highlighted ?? false
  const dimmed = d.dimmed ?? false
  const solid  = `hsl(${h}, 60%, 62%)`
  const dim    = `hsla(${h}, 60%, 62%, 0.5)`
  const faint  = `hsla(${h}, 60%, 62%, 0.12)`
  const border = hi ? `hsl(${h}, 60%, 62%)` : `hsla(${h}, 60%, 62%, 0.35)`
  const glow   = `hsla(${h}, 60%, 62%, ${hi ? 0.45 : 0.18})`

  const dotHandle: React.CSSProperties = {
    background: solid,
    width: 8, height: 8,
    border: 'none', borderRadius: 4, opacity: 0.75
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    d.onToggle(d.folderKey)
  }

  const chevronBtn: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: 3, display: 'flex', alignItems: 'center',
    color: dim, flexShrink: 0, borderRadius: 4
  }

  // ── Collapsed: compact card ──────────────────────────────────────────────────
  if (!d.expanded) {
    return (
      <div style={{
        width: '100%', height: '100%',
        background: 'rgba(10,14,26,0.94)',
        border: `1.5px solid ${selected || hi ? solid : border}`,
        borderLeft: `3px solid ${solid}`,
        borderRadius: 8,
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center',
        padding: '0 10px 0 12px', gap: 8,
        cursor: 'default',
        opacity: dimmed ? 0.2 : 1,
        boxShadow: hi ? `0 0 18px ${glow}` : selected ? `0 0 14px ${glow}` : `0 2px 8px rgba(0,0,0,0.55)`,
        transition: 'opacity 0.3s ease, box-shadow 0.2s',
        overflow: 'hidden'
      }}>
        <Handle type="target" position={Position.Left} style={dotHandle} />
        <Handle type="source" position={Position.Right} style={dotHandle} />

        {/* Color dot */}
        <div style={{ width: 7, height: 7, borderRadius: 2, background: solid, flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          {parentPath && (
            <div style={{ fontSize: 8, color: dim, fontFamily: 'monospace', marginBottom: 1 }}>
              {parentPath}/
            </div>
          )}
          <div style={{
            fontSize: 12, fontWeight: 700, color: '#e2e8f0',
            fontFamily: 'monospace',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {name || d.label}/
          </div>
        </div>

        <span style={{
          fontSize: 9, color: solid, background: faint,
          padding: '2px 5px', borderRadius: 5, flexShrink: 0
        }}>
          {d.fileCount}
        </span>

        <button onClick={handleToggle} title="Expand folder" style={chevronBtn}>
          <ChevronRight size={14} />
        </button>
      </div>
    )
  }

  // ── Expanded: file grid container ────────────────────────────────────────────
  return (
    <div style={{
      width: '100%', height: '100%',
      background: faint,
      border: `1.5px solid ${selected || hi ? solid : border}`,
      borderTop: `2px solid ${solid}`,
      borderRadius: 10,
      backdropFilter: 'blur(4px)',
      opacity: dimmed ? 0.2 : 1,
      boxShadow: hi ? `0 0 22px ${glow}` : selected ? `0 0 20px ${glow}` : `0 4px 20px rgba(0,0,0,0.4)`,
      transition: 'opacity 0.3s ease, box-shadow 0.2s'
    }}>
      <Handle type="target" position={Position.Left} style={{ ...dotHandle, top: 22 }} />
      <Handle type="source" position={Position.Right} style={{ ...dotHandle, top: 22 }} />

      <div style={{
        padding: '9px 14px',
        borderBottom: `1px solid ${border}`,
        display: 'flex', alignItems: 'center', gap: 8,
        cursor: 'grab', userSelect: 'none'
      }}>
        <div style={{ width: 7, height: 7, borderRadius: 2, background: solid, flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 0 }}>
          {parentPath && (
            <span style={{ fontSize: 8, color: dim, fontFamily: 'monospace' }}>{parentPath}/</span>
          )}
          <span style={{
            fontSize: 12, fontWeight: 700, color: '#e2e8f0',
            fontFamily: 'monospace',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {name || d.label}/
          </span>
        </div>
        <span style={{
          fontSize: 9, color: solid, background: faint,
          padding: '2px 6px', borderRadius: 7, flexShrink: 0
        }}>
          {d.fileCount}
        </span>
        <button onClick={handleToggle} title="Collapse folder" style={chevronBtn}>
          <ChevronDown size={14} />
        </button>
      </div>

      {d.aiSummary && (
        <div style={{
          padding: '5px 14px 8px', fontSize: 9,
          color: 'rgba(148,163,184,0.45)', fontStyle: 'italic', lineHeight: 1.4
        }}>
          {d.aiSummary}
        </div>
      )}
    </div>
  )
})

FolderNode.displayName = 'FolderNode'
