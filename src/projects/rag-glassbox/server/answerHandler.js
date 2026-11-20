// Stage 6 of RAG: generation. Runs on the server (Vercel function / Vite dev middleware), never in the browser,
// because it holds the provider API keys. Answers come from free LLM tiers with automatic failover.
import corpus from '../data/chunks.json' with { type: 'json' }
import { MAX_QUESTION_LENGTH, MAX_SOURCES, buildPrompt } from '../pipeline/prompt.js'
import { formatSse } from '../pipeline/sse.js'
import { createAnswerCache } from './answerCache.js'
import { buildChain } from './llm/providers.js'
import { FIRST_TOKEN_TIMEOUT_MS, streamChain } from './llm/streamChain.js'

const RATE_LIMIT = { requests: 8, windowMs: 60_000 }

const chunksBySize = Object.fromEntries(
  Object.entries(corpus.sizes).map(([size, { chunks }]) => [size, new Map(chunks.map((chunk) => [chunk.id, chunk]))])
)

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

/** The browser only sends ids; the server rebuilds the context itself, so the endpoint can't be used as a free LLM proxy. */
export function validateRequest(body) {
  if (!body || typeof body !== 'object') return { error: 'Expected a JSON body.' }
  const { question, size, chunkIds } = body
  if (typeof question !== 'string' || !question.trim()) return { error: 'Missing question.' }
  if (question.length > MAX_QUESTION_LENGTH) return { error: `Questions are limited to ${MAX_QUESTION_LENGTH} characters.` }
  const chunks = chunksBySize[size]
  if (!chunks) return { error: 'Unknown chunk size.' }
  if (!Array.isArray(chunkIds) || chunkIds.length === 0 || chunkIds.length > MAX_SOURCES) {
    return { error: `Send between 1 and ${MAX_SOURCES} chunk ids.` }
  }
  const sources = chunkIds.map((id) => chunks.get(id))
  if (sources.some((source) => !source)) return { error: 'Unknown chunk id.' }
  return { question: question.trim(), sources, chunkIds }
}

function createRateLimiter({ requests, windowMs }, now) {
  const hits = new Map()
  return (key) => {
    const recent = (hits.get(key) ?? []).filter((time) => now() - time < windowMs)
    if (recent.length >= requests) return true
    recent.push(now())
    hits.set(key, recent)
    return false
  }
}

const sseResponse = (stream) =>
  new Response(stream, {
    headers: { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache, no-transform', 'x-accel-buffering': 'no' },
  })

const publicCandidate = ({ provider, label, model }) => ({ provider, label, model })

export function createAnswerHandler({
  getChain = () => buildChain(process.env),
  fetchImpl = (...args) => fetch(...args),
  cache = createAnswerCache(),
  firstTokenTimeoutMs = Number(process.env.LLM_FIRST_TOKEN_TIMEOUT_MS) || FIRST_TOKEN_TIMEOUT_MS,
  now = Date.now,
} = {}) {
  const isRateLimited = createRateLimiter(RATE_LIMIT, now)

  return async function POST(request) {
    const chain = getChain()
    if (chain.length === 0) {
      return json(503, { error: 'Generation is off: the server has no LLM provider configured (GROQ_API_KEY or GEMINI_API_KEY).' })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return json(400, { error: 'Expected a JSON body.' })
    }
    const { error, question, sources, chunkIds } = validateRequest(body)
    if (error) return json(400, { error })

    const encoder = new TextEncoder()
    const encode = (event, data) => encoder.encode(formatSse(event, data))

    // A cached answer costs no quota, so it is served before the rate limit is even checked.
    const cached = cache.get({ question, chunkIds })
    if (cached) {
      return sseResponse(
        new ReadableStream({
          start(controller) {
            controller.enqueue(encode('meta', { ...cached.candidate, cached: true }))
            controller.enqueue(encode('text', { text: cached.text }))
            controller.enqueue(encode('done', { ...cached.candidate, cached: true, usage: null }))
            controller.close()
          },
        })
      )
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local'
    if (isRateLimited(ip)) return json(429, { error: 'Too many questions. Wait a minute and try again.' })

    const prompt = buildPrompt(question, sources)

    return sseResponse(
      new ReadableStream({
        async start(controller) {
          const send = (event, data) => controller.enqueue(encode(event, data))
          let candidate = null
          let text = ''
          let usage = null
          let firstTokenMs = null
          try {
            for await (const step of streamChain(chain, prompt, { fetchImpl, signal: request.signal, firstTokenTimeoutMs })) {
              if (step.type === 'attempt-failed') send('fallback', { ...publicCandidate(step.candidate), reason: step.reason })
              else if (step.type === 'start') {
                candidate = publicCandidate(step.candidate)
                firstTokenMs = step.firstTokenMs
                send('meta', { ...candidate, firstTokenMs })
              } else if (step.type === 'text') {
                text += step.text
                send('text', { text: step.text })
              } else if (step.type === 'usage') {
                usage = { input: step.usage.prompt_tokens ?? null, output: step.usage.completion_tokens ?? null }
              } else if (step.type === 'unavailable') {
                send('error', { message: 'Every free model is busy or out of quota right now. Try again in a minute.' })
              }
            }
            if (candidate && text.trim()) {
              cache.set({ question, chunkIds }, { candidate, text })
              send('done', { ...candidate, cached: false, firstTokenMs, usage })
            }
          } catch {
            if (!request.signal?.aborted) send('error', { message: 'The answer was interrupted. Try again.' })
          } finally {
            controller.close()
          }
        },
      })
    )
  }
}
