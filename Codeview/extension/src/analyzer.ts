import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'

export interface FileNode {
  id: string
  folder: string
  label: string
  size: number
  content: string
}

export interface ImportEdge {
  id: string
  source: string
  target: string
}

export interface GraphData {
  nodes: FileNode[]
  edges: ImportEdge[]
}

const IMPORT_REGEX = /(?:import|from)\s+['"]([^'"]+)['"]/g
const REQUIRE_REGEX = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g

function resolveImport(fromFile: string, importPath: string, workspaceRoot: string): string | null {
  if (!importPath.startsWith('.')) return null

  const fromDir = path.dirname(fromFile)
  const resolved = path.resolve(fromDir, importPath)
  const rel = path.relative(workspaceRoot, resolved).replace(/\\/g, '/')

  const extensions = ['.ts', '.tsx', '.js', '.jsx']
  for (const ext of extensions) {
    if (fs.existsSync(path.join(workspaceRoot, rel + ext))) return rel + ext
    const idx = path.join(rel, 'index') + ext
    if (fs.existsSync(path.join(workspaceRoot, idx))) return idx.replace(/\\/g, '/')
  }
  return null
}

export async function analyzeWorkspace(workspaceRoot: string): Promise<GraphData> {
  const uris = await vscode.workspace.findFiles(
    '**/*.{ts,tsx,js,jsx}',
    '{**/node_modules/**,**/dist/**,**/build/**,**/.git/**,**/out/**}'
  )

  const nodes: FileNode[] = []
  const edges: ImportEdge[] = []
  const edgeSet = new Set<string>()

  for (const uri of uris) {
    const absPath = uri.fsPath
    const relPath = path.relative(workspaceRoot, absPath).replace(/\\/g, '/')
    const stat = fs.statSync(absPath)

    if (stat.size > 200 * 1024) continue

    let content = ''
    try {
      content = fs.readFileSync(absPath, 'utf-8')
    } catch {
      continue
    }

    const folder = path.dirname(relPath)
    nodes.push({
      id: relPath,
      folder: folder === '.' ? '' : folder,
      label: path.basename(relPath),
      size: stat.size,
      content
    })

    for (const regex of [IMPORT_REGEX, REQUIRE_REGEX]) {
      regex.lastIndex = 0
      let match
      while ((match = regex.exec(content)) !== null) {
        const target = resolveImport(absPath, match[1], workspaceRoot)
        if (target) {
          const edgeId = `${relPath}→${target}`
          if (!edgeSet.has(edgeId)) {
            edgeSet.add(edgeId)
            edges.push({ id: edgeId, source: relPath, target })
          }
        }
      }
    }
  }

  return { nodes, edges }
}
