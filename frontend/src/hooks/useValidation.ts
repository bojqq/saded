import { useState, useRef, useCallback } from 'react'
import type { ValidationResponse } from '@/lib/api'
import { WS_URL } from '@/lib/api'

export function useWebSocketValidation() {
  const wsRef = useRef<WebSocket | null>(null)
  const [result, setResult] = useState<Partial<ValidationResponse> | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    const ws = new WebSocket(WS_URL)
    ws.onopen = () => setIsConnected(true)
    ws.onclose = () => setIsConnected(false)
    ws.onerror = () => setIsConnected(false)
    ws.onmessage = (e) => {
      try {
        setResult(JSON.parse(e.data))
      } catch { /* ignore */ }
    }
    wsRef.current = ws
  }, [])

  const sendField = useCallback((field: string, value: unknown, context: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ field, value, context }))
    }
  }, [])

  const disconnect = useCallback(() => {
    wsRef.current?.close()
    wsRef.current = null
  }, [])

  return { result, isConnected, connect, disconnect, sendField }
}
