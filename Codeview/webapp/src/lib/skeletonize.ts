import { RawFileNode } from '../types'

// Uses the server-generated skeleton (TypeScript declaration format).
// The server already ran @babel/parser on each file — no regex needed here.
export function skeletonizeNodes(nodes: RawFileNode[]): string {
  return nodes
    .filter(n => n.skeleton)
    .map(n => n.skeleton)
    .join('\n\n')
}

// Still used by FileNode for the semantic-zoom code display.
// Strips to signatures so the node doesn't overflow at high zoom.
export function skeletonize(content: string): string {
  const lines = content.split('\n')
  const result: string[] = []
  for (const line of lines) {
    const t = line.trim()
    if (
      t.startsWith('import ') ||
      t.startsWith('export {') ||
      /^export\s+(default\s+)?(async\s+)?function\s+\w+/.test(t) ||
      /^export\s+(abstract\s+)?class\s+\w+/.test(t) ||
      /^export\s+(const|let|var)\s+\w+/.test(t) ||
      /^export\s+(type|interface|enum)\s+\w+/.test(t) ||
      /^(async\s+)?function\s+\w+/.test(t) ||
      /^class\s+\w+/.test(t)
    ) {
      result.push(line)
    }
  }
  return result.join('\n')
}
