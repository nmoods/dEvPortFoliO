import { useCallback, useEffect, useRef, useState } from 'react'
import { createSseParser } from '../pipeline/sse'

const IDLE = { status: 'idle', text: '', model: null, fallback: null, usage: null, error: null, request: null }

/** POSTs the question + chunk ids to /api/answer and accumulates the streamed answer. */
export function useAnswerStream() {
  const [answer, setAnswer] = useState(IDLE)
  const controllerRef = useRef(null)

  useEffect(() => () => controllerRef.current?.abort(), [])

  const start = useCallback(async (request) => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setAnswer({ ...IDLE, status: 'streaming', request })

    try {
      const response = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal,
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        const status = response.status === 503 ? 'disabled' : 'error'
        setAnswer((a) => ({ ...a, status, error: body.error ?? `Request failed (${response.status}).` }))
        return
      }

      const feed = createSseParser((event, data) => {
        setAnswer((a) => {
          switch (event) {
            case 'meta':
              return { ...a, model: data.model }
            case 'fallback':
              return { ...a, fallback: data }
            case 'text':
              return { ...a, text: a.text + data.text }
            case 'done':
              return { ...a, status: 'done', model: data.model, usage: data.usage }
            case 'error':
              return { ...a, status: 'error', error: data.message }
            default:
              return a
          }
        })
      })

      const decoder = new TextDecoder()
      const reader = response.body.getReader()
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        feed(decoder.decode(value, { stream: true }))
      }
      setAnswer((a) => (a.status === 'streaming' ? { ...a, status: 'done' } : a))
    } catch (failure) {
      if (failure.name === 'AbortError') return
      setAnswer((a) => ({ ...a, status: 'error', error: 'Could not reach the answer endpoint.' }))
    }
  }, [])

  const reset = useCallback(() => {
    controllerRef.current?.abort()
    setAnswer(IDLE)
  }, [])

  return { answer, start, reset }
}
