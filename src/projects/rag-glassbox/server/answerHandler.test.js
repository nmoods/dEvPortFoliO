import { describe, expect, it, vi } from 'vitest'
import corpus from '../data/chunks.json' with { type: 'json' }
import { createSseParser } from '../pipeline/sse'
import { createAnswerHandler, validateRequest } from './answerHandler'

const [first, second] = corpus.sizes.medium.chunks
const validBody = { question: 'Which trail crosses Corsica?', size: 'medium', chunkIds: [first.id, second.id] }

const post = (body, headers = {}) =>
  new Request('http://localhost/api/answer', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json', ...headers } })

function fakeClient(events, final) {
  const stream = vi.fn(() => ({
    async *[Symbol.asyncIterator]() {
      yield* events
    },
    finalMessage: async () => final,
  }))
  return { client: { beta: { messages: { stream } } }, stream }
}

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
  it('returns 503 when no API key is configured', async () => {
    const handler = createAnswerHandler({ getApiKey: () => undefined })
    expect((await handler(post(validBody))).status).toBe(503)
  })

  it('returns 400 on an invalid request without calling Claude', async () => {
    const { client, stream } = fakeClient([], {})
    const handler = createAnswerHandler({ getApiKey: () => 'key', createClient: () => client })
    expect((await handler(post({ question: '' }))).status).toBe(400)
    expect(stream).not.toHaveBeenCalled()
  })

  it('streams text, fallback and done events, sending the server-built prompt', async () => {
    const { client, stream } = fakeClient(
      [
        { type: 'message_start', message: { model: 'claude-opus-5-5' } },
        { type: 'content_block_start', content_block: { type: 'fallback', from: { model: 'a' }, to: { model: 'b' } } },
        { type: 'content_block_delta', delta: { type: 'text_delta', text: 'The GR20 ' } },
        { type: 'content_block_delta', delta: { type: 'thinking_delta', thinking: '' } },
        { type: 'content_block_delta', delta: { type: 'text_delta', text: 'crosses Corsica [1].' } },
      ],
      { model: 'claude-opus-5-5', stop_reason: 'end_turn', usage: { input_tokens: 900, output_tokens: 40 } }
    )
    const handler = createAnswerHandler({ getApiKey: () => 'key', createClient: () => client })
    const response = await handler(post(validBody))

    expect(response.headers.get('content-type')).toMatch(/text\/event-stream/)
    expect(await readEvents(response)).toEqual([
      ['meta', { model: 'claude-opus-5-5' }],
      ['fallback', { from: 'a', to: 'b' }],
      ['text', { text: 'The GR20 ' }],
      ['text', { text: 'crosses Corsica [1].' }],
      ['done', { model: 'claude-opus-5-5', stopReason: 'end_turn', usage: { input: 900, output: 40 } }],
    ])
    const params = stream.mock.calls[0][0]
    expect(params).toMatchObject({ model: 'claude-opus-5-5', fallbacks: 'default', output_config: { effort: 'low' } })
    expect(params.messages[0].content).toContain(first.text)
  })

  it('reports a refusal as an error event', async () => {
    const { client } = fakeClient([], { stop_reason: 'refusal', usage: {} })
    const handler = createAnswerHandler({ getApiKey: () => 'key', createClient: () => client })
    const events = await readEvents(await handler(post(validBody)))
    expect(events.at(-1)).toEqual(['error', { message: 'The model declined to answer this question.' }])
  })

  it('rate-limits each client IP', async () => {
    const { client } = fakeClient([], { stop_reason: 'end_turn', usage: {} })
    const handler = createAnswerHandler({ getApiKey: () => 'key', createClient: () => client, now: () => 1000 })
    const statuses = []
    for (let i = 0; i < 9; i += 1) statuses.push((await handler(post(validBody, { 'x-forwarded-for': '1.2.3.4' }))).status)
    expect(statuses.slice(0, 8).every((s) => s === 200)).toBe(true)
    expect(statuses[8]).toBe(429)
    expect((await handler(post(validBody, { 'x-forwarded-for': '5.6.7.8' }))).status).toBe(200)
  })
})
