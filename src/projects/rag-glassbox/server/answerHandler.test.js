import { describe, expect, it, vi } from 'vitest'
import corpus from '../data/chunks.json' with { type: 'json' }
import { createSseParser } from '../pipeline/sse'
import { createAnswerHandler, validateRequest } from './answerHandler'

const [first, second] = corpus.sizes.medium.chunks
const validBody = { question: 'How high is Le Pouce?', size: 'medium', chunkIds: [first.id, second.id] }
const encoder = new TextEncoder()

const post = (body, headers = {}) =>
  new Request('http://localhost/api/answer', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json', ...headers } })

const candidate = (provider, model) => ({ provider, label: provider.toUpperCase(), model, url: `https://${provider}.test/v1/chat/completions`, apiKey: 'k', params: {} })
const CHAIN = [candidate('groq', 'gpt-oss-120b'), candidate('gemini', 'flash-lite')]

const streamOf = (...texts) =>
  new Response(
    new ReadableStream({
      start(controller) {
        for (const text of texts) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`))
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [], usage: { prompt_tokens: 900, completion_tokens: 40 } })}\n\ndata: [DONE]\n\n`))
        controller.close()
      },
    }),
    { status: 200 }
  )

async function readEvents(response) {
  const events = []
  const feed = createSseParser((event, data) => events.push([event, data]))
  feed(await response.text())
  return events
}

describe('validateRequest', () => {
  it('rebuilds sources from ids and rejects anything else', () => {
    expect(validateRequest(validBody).sources.map((s) => s.id)).toEqual([first.id, second.id])
    expect(validateRequest({ ...validBody, chunkIds: ['nope#1'] }).error).toMatch(/Unknown chunk id/)
    expect(validateRequest({ ...validBody, size: 'huge' }).error).toMatch(/size/)
    expect(validateRequest({ ...validBody, question: 'x'.repeat(301) }).error).toMatch(/300/)
    expect(validateRequest({ ...validBody, chunkIds: Array(9).fill(first.id) }).error).toMatch(/between 1 and 8/)
  })
})

describe('answer handler', () => {
  it('returns 503 when no provider is configured', async () => {
    const handler = createAnswerHandler({ getChain: () => [] })
    const response = await handler(post(validBody))
    expect(response.status).toBe(503)
    expect((await response.json()).error).toMatch(/GROQ_API_KEY or GEMINI_API_KEY/)
  })

  it('returns 400 on an invalid request without calling any model', async () => {
    const fetchImpl = vi.fn()
    const handler = createAnswerHandler({ getChain: () => CHAIN, fetchImpl })
    expect((await handler(post({ question: '' }))).status).toBe(400)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('fails over, streams the answer and sends the server-built prompt', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response('quota', { status: 429 }))
      .mockResolvedValueOnce(streamOf('Le Pouce is ', 'about 812 m [1].'))
    const handler = createAnswerHandler({ getChain: () => CHAIN, fetchImpl })
    const response = await handler(post(validBody))

    expect(response.headers.get('content-type')).toMatch(/text\/event-stream/)
    const events = await readEvents(response)
    expect(events.map(([event]) => event)).toEqual(['fallback', 'meta', 'text', 'text', 'done'])
    expect(events[0][1]).toEqual({ provider: 'groq', label: 'GROQ', model: 'gpt-oss-120b', reason: 'rate-limited' })
    expect(events[1][1]).toMatchObject({ provider: 'gemini', model: 'flash-lite' })
    expect(events.at(-1)[1]).toMatchObject({ provider: 'gemini', cached: false, usage: { input: 900, output: 40 } })

    const sent = JSON.parse(fetchImpl.mock.calls[1][1].body)
    expect(sent.messages[1].content).toContain(first.text)
    expect(fetchImpl.mock.calls[1][1].headers.authorization).toBe('Bearer k')
  })

  it('serves a repeated question from the cache without calling a model or counting against the rate limit', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(streamOf('Cached answer [1].'))
    const handler = createAnswerHandler({ getChain: () => CHAIN, fetchImpl, now: () => 1000 })
    await readEvents(await handler(post(validBody)))

    const events = []
    for (let i = 0; i < 12; i += 1) events.push(await readEvents(await handler(post({ ...validBody, question: '  how HIGH is le pouce? ' }))))
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(events.at(-1)).toEqual([
      ['meta', { provider: 'groq', label: 'GROQ', model: 'gpt-oss-120b', cached: true }],
      ['text', { text: 'Cached answer [1].' }],
      ['done', { provider: 'groq', label: 'GROQ', model: 'gpt-oss-120b', cached: true, usage: null }],
    ])
  })

  it('tells the visitor when every free model is unavailable', async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 503 }))
    const handler = createAnswerHandler({ getChain: () => CHAIN, fetchImpl })
    const events = await readEvents(await handler(post(validBody)))
    expect(events.map(([event]) => event)).toEqual(['fallback', 'fallback', 'error'])
    expect(events.at(-1)[1].message).toMatch(/busy or out of quota/)
  })

  it('rate-limits each client IP for uncached questions', async () => {
    const fetchImpl = vi.fn(async () => streamOf('ok'))
    const handler = createAnswerHandler({ getChain: () => CHAIN, fetchImpl, now: () => 1000 })
    const statuses = []
    for (let i = 0; i < 9; i += 1) {
      statuses.push((await handler(post({ ...validBody, question: `Question ${i}?` }, { 'x-forwarded-for': '1.2.3.4' }))).status)
    }
    expect(statuses.slice(0, 8).every((s) => s === 200)).toBe(true)
    expect(statuses[8]).toBe(429)
    expect((await handler(post({ ...validBody, question: 'Other?' }, { 'x-forwarded-for': '5.6.7.8' }))).status).toBe(200)
  })
})
