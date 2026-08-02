import { useState, useEffect, useCallback } from 'react'
import { RawGraphData } from '../types'

const SERVER = 'http://localhost:3001/graph'
const POLL_MS = 10_000

export function useGraphData() {
  const [rawData, setRawData] = useState<RawGraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGraph = useCallback(async () => {
    try {
      const res = await fetch(SERVER)
      if (!res.ok) throw new Error(`Server returned ${res.status}`)
      const data: RawGraphData = await res.json()
      setRawData(data)
      setError(null)
    } catch {
      setError('Cannot reach extension server. Run "CodeSight: Start Visualizer" in VS Code.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGraph()
    const id = setInterval(fetchGraph, POLL_MS)
    return () => clearInterval(id)
  }, [fetchGraph])

  return { rawData, loading, error, refetch: fetchGraph }
}
