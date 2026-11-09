import { useCallback, useEffect, useRef, useState } from 'react'

/** Owns the embedding worker: model download progress + a promise-based `embed(text)`. */
export function useEmbedder() {
  const workerRef = useRef(null)
  const pendingRef = useRef(new Map())
  const nextIdRef = useRef(0)
  const [state, setState] = useState({ status: 'loading', loaded: 0, total: 0, error: null })

  useEffect(() => {
    const worker = new Worker(new URL('../pipeline/embed.worker.js', import.meta.url), { type: 'module' })
    const pending = pendingRef.current
    workerRef.current = worker

    worker.onmessage = ({ data }) => {
      if (data.type === 'progress') setState((s) => ({ ...s, loaded: data.loaded, total: data.total }))
      else if (data.type === 'ready') setState((s) => ({ ...s, status: 'ready', error: null }))
      else if (data.type === 'error') setState((s) => ({ ...s, status: 'error', error: data.message }))
      else if (data.type === 'vector' || data.type === 'vector-error') {
        const request = pending.get(data.id)
        pending.delete(data.id)
        if (data.type === 'vector') request?.resolve({ vector: data.vector, ms: data.ms })
        else request?.reject(new Error(data.message))
      }
    }
    worker.postMessage({ type: 'load' })

    return () => {
      worker.terminate()
      for (const request of pending.values()) request.reject(new Error('Embedder closed'))
      pending.clear()
    }
  }, [])

  const embed = useCallback((text) => {
    const id = (nextIdRef.current += 1)
    return new Promise((resolve, reject) => {
      pendingRef.current.set(id, { resolve, reject })
      workerRef.current.postMessage({ type: 'embed', id, text })
    })
  }, [])

  return { ...state, embed }
}
