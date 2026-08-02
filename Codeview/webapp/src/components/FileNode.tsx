import { memo } from 'react'
import { NodeProps, Handle, Position, NodeResizer, useViewport } from '@xyflow/react'

interface FileData {
  label: string
  path: string
  content: string
  size: number
  highlighted?: boolean
  dimmed?: boolean
  highlightReason?: string
}

function fileColor(label: string): string {
  if (label.endsWith('.tsx') || label.endsWith('.jsx')) return '#06b6d4'
  if (label.endsWith('.ts')) return '#3b82f6'
  if (label.endsWith('.js')) return '#f59e0b'
  if (label.endsWith('.css')) return '#ec4899'
  return '#94a3b8'
}

export const FileNode = memo(({ data, selected }: NodeProps) => {
  const d = data as unknown as FileData
  const { zoom } = useViewport()
  const color = fileColor(d.label)
  const hi = d.highlighted ?? false
  const dimmed = d.dimmed ?? false
  const showCode = zoom > 1.2

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0d1424',
      border: `1.5px solid ${hi ? '#f59e0b' : selected ? color : color + '44'}`,
      opacity: dimmed ? 0.2 : 1,
      borderRadius: 7,
      overflow: 'hidden',
      boxShadow: hi
        ? `0 0 18px ${color}55, 0 0 6px #f59e0b33`
        : selected
        ? `0 0 10px ${color}33`
        : '0 2px 12px rgba(0,0,0,0.5)',
      transition: 'opacity 0.3s ease, border-color 0.2s, box-shadow 0.2s'
    }}>
      <NodeResizer
        minWidth={160}
        minHeight={80}
        color={color}
        handleStyle={{ width: 7, height: 7, borderRadius: 2, opacity: selected ? 1 : 0 }}
        lineStyle={{ borderColor: color + '66', opacity: selected ? 1 : 0 }}
      />
      <Handle type="target" position={Position.Left} style={{ background: color, width: 7, height: 7, border: 'none' }} />
      <Handle type="source" position={Position.Right} style={{ background: color, width: 7, height: 7, border: 'none' }} />

      {/* Title bar — always visible at all zoom levels */}
      <div style={{
        padding: '5px 9px',
        background: `${color}18`,
        borderBottom: `1px solid ${color}2a`,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexShrink: 0,
        height: 30
      }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          color: '#e2e8f0',
          fontFamily: 'monospace',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {d.label}
        </span>
        {hi && (
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#f59e0b', flexShrink: 0,
            animation: 'pulse 1.5s ease-in-out infinite'
          }} />
        )}
      </div>

      {/* Content area: dark when zoomed out, code when zoomed in */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0 }}>
        {showCode ? (
          <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
            <pre style={{
              margin: 0,
              padding: '8px 10px',
              fontSize: 9.5,
              lineHeight: 1.65,
              color: '#94a3b8',
              fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", "Courier New", monospace',
              whiteSpace: 'pre',
              tabSize: 2
            }}>
              {d.content || '// empty'}
            </pre>
          </div>
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: '#0a101e',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5
          }}>
            <div style={{
              width: 28,
              height: 3,
              borderRadius: 2,
              background: color + '33'
            }} />
            <div style={{ width: 20, height: 2, borderRadius: 2, background: color + '22' }} />
            <div style={{ width: 24, height: 2, borderRadius: 2, background: color + '1a' }} />
            <div style={{
              marginTop: 4,
              fontSize: 8,
              color: '#1e3a5f',
              fontFamily: 'monospace'
            }}>
              {(d.size / 1024).toFixed(1)}kb
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

FileNode.displayName = 'FileNode'
