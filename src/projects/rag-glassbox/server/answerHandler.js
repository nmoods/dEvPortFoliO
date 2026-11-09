// Stage 6 of RAG: generation. Runs on the server (Vercel function / Vite dev middleware), never in the browser,
// because it holds the Anthropic API key.
import Anthropic from '@anthropic-ai/sdk'
import corpus from '../data/chunks.json' with { type: 'json' }
import { MAX_QUESTION_LENGTH, MAX_SOURCES, buildPrompt } from '../pipeline/prompt.js'
import { formatSse } from '../pipeline/sse.js'

export const MODEL = 'claude-opus-5-5'
const MAX_TOKENS = 4000
const RATE_LIMIT = { requests: 8, windowMs: 60_000 }

const chunksBySize = Object.fromEntries(
  Object.entries(corpus.sizes).map(([size, { chunks }]) => [size, new Map(chunks.map((chunk) => [chunk.id, chunk]))])
)

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

/** The browser only sends ids; the server rebuilds the context itself, so the endpoint can't be used as a free Claude proxy. */
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
  return { question: question.trim(), sources }
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

function describeError(error) {
  if (error instanceof Anthropic.RateLimitError) return 'Claude is busy right now. Try again in a minute.'
  if (error instanceof Anthropic.AuthenticationError) return 'The server’s API key was rejected.'
  if (error instanceof Anthropic.APIError) return `Claude API error (${error.status ?? 'network'}).`
  if (error?.name === 'AbortError') return 'Request cancelled.'
  return 'Generation failed.'
}

export function createAnswerHandler({
  getApiKey = () => process.env.ANTHROPIC_API_KEY,
  createClient = (apiKey) => new Anthropic({ apiKey }),
  now = Date.now,
} = {}) {
  const isRateLimited = createRateLimiter(RATE_LIMIT, now)

  return async function POST(request) {
    const apiKey = getApiKey()
    if (!apiKey) return json(503, { error: 'Generation is disabled: the server has no ANTHROPIC_API_KEY.' })

    let body
    try {
      body = await request.json()
    } catch {
      return json(400, { error: 'Expected a JSON body.' })
    }
    const { error, question, sources } = validateRequest(body)
    if (error) return json(400, { error })

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local'
    if (isRateLimited(ip)) return json(429, { error: 'Too many questions. Wait a minute and try again.' })

    const { system, user } = buildPrompt(question, sources)
    const client = createClient(apiKey)
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event, data) => controller.enqueue(encoder.encode(formatSse(event, data)))
        try {
          const response = client.beta.messages.stream(
            {
              model: MODEL,
              max_tokens: MAX_TOKENS,
              // Opus 5.5 always thinks; low effort keeps a short, grounded answer fast and cheap.
              output_config: { effort: 'low' },
              // If a safety classifier declines, the API re-runs the request on a recommended fallback model.
              betas: ['server-side-fallback-2026-07-01'],
              fallbacks: 'default',
              system,
              messages: [{ role: 'user', content: user }],
            },
            { signal: request.signal }
          )

          for await (const event of response) {
            if (event.type === 'message_start') send('meta', { model: event.message.model })
            else if (event.type === 'content_block_start' && event.content_block.type === 'fallback') {
              send('fallback', { from: event.content_block.from?.model ?? null, to: event.content_block.to?.model ?? null })
            } else if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              send('text', { text: event.delta.text })
            }
          }

          const message = await response.finalMessage()
          if (message.stop_reason === 'refusal') send('error', { message: 'The model declined to answer this question.' })
          else {
            send('done', {
              model: message.model,
              stopReason: message.stop_reason,
              usage: { input: message.usage.input_tokens, output: message.usage.output_tokens },
            })
          }
        } catch (caught) {
          send('error', { message: describeError(caught) })
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache, no-transform', 'x-accel-buffering': 'no' },
    })
  }
}
