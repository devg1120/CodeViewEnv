import * as http from 'http'
import { analyzeWorkspace, GraphData } from './analyzer'

let server: http.Server | null = null

export async function startServer(workspacePath: string): Promise<void> {
  if (server) server.close()

  let cached: GraphData | null = null
  let lastFetch = 0

  async function getGraph(): Promise<GraphData> {
    if (!cached || Date.now() - lastFetch > 10_000) {
      cached = await analyzeWorkspace(workspacePath)
      lastFetch = Date.now()
    }
    return cached
  }

  server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

    if (req.url === '/graph' && req.method === 'GET') {
      try {
        const data = await getGraph()
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(data))
      } catch {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Analysis failed' }))
      }
      return
    }

    res.writeHead(404)
    res.end()
  })

  return new Promise(resolve => server!.listen(3001, resolve))
}

export function stopServer(): void {
  server?.close()
  server = null
}
