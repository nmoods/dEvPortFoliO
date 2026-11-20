// Failover across free providers: try each model in order, move on when one is rate-limited, broken or slow
// to start, and commit to the first one that actually starts streaming. Visitors never wait on a dead provider.
import { createThinkFilter, readChatStream } from './openaiStream.js'

export const FIRST_TOKEN_TIMEOUT_MS = 4000
const MAX_TOKENS = 1024

const describeStatus = (status) =>
  status === 429 ? 'rate-limited' : status === 401 || status === 403 ? 'key rejected' : status >= 500 ? 'provider error' : `HTTP ${status}`

/**
 * Yields { type: 'attempt-failed' | 'start' | 'text' | 'usage' | 'unavailable', ... }.
 * After 'start' the chain is committed: a failure mid-answer is thrown, never retried elsewhere,
 * because the visitor has already seen part of the text.
 */
export async function* streamChain(chain, { system, user }, { fetchImpl = fetch, signal, firstTokenTimeoutMs = FIRST_TOKEN_TIMEOUT_MS } = {}) {
  for (const candidate of chain) {
    if (signal?.aborted) return
    const controller = new AbortController()
    const onAbort = () => controller.abort()
    signal?.addEventListener('abort', onAbort)
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, firstTokenTimeoutMs)
    const started = Date.now()
    let committed = false

    try {
      const response = await fetchImpl(candidate.url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${candidate.apiKey}` },
        body: JSON.stringify({
          model: candidate.model,
          stream: true,
          stream_options: { include_usage: true },
          max_tokens: MAX_TOKENS,
          temperature: 0.2,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          ...candidate.params,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        clearTimeout(timer)
        yield { type: 'attempt-failed', candidate, reason: describeStatus(response.status) }
        continue
      }

      const filter = createThinkFilter()
      for await (const chunk of readChatStream(response.body)) {
        // Any chunk, even reasoning, proves the provider is alive: stop the first-token clock.
        clearTimeout(timer)
        const text = filter(chunk.choices?.[0]?.delta?.content ?? '')
        if (text) {
          if (!committed) {
            committed = true
            yield { type: 'start', candidate, firstTokenMs: Date.now() - started }
          }
          yield { type: 'text', text }
        }
        if (chunk.usage) yield { type: 'usage', usage: chunk.usage }
      }

      if (committed) return
      yield { type: 'attempt-failed', candidate, reason: 'empty answer' }
    } catch (error) {
      if (signal?.aborted) return
      if (committed) throw error
      yield { type: 'attempt-failed', candidate, reason: timedOut ? `no answer within ${firstTokenTimeoutMs / 1000} s` : 'network error' }
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
    }
  }
  yield { type: 'unavailable' }
}
