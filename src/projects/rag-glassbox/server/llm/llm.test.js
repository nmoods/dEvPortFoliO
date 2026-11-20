import { describe, expect, it, vi } from 'vitest'
import { createThinkFilter, readChatStream } from './openaiStream'
import { buildChain } from './providers'
import { streamChain } from './streamChain'

const encoder = new TextEncoder()

/** An OpenAI-style SSE body, optionally split into awkward network chunks. */
function sseBody(chunks, { split = 0, hang = false } = {}) {
  const wire = chunks.map((chunk) => `data: ${typeof chunk === 'string' ? chunk : JSON.stringify(chunk)}\n\n`).join('')
  const parts = split ? wire.match(new RegExp(`[\\s\\S]{1,${split}}`, 'g')) : [wire]
  return new ReadableStream({
    start(controller) {
      for (const part of parts) controller.enqueue(encoder.encode(part))
      if (!hang) controller.close()
    },
  })
}

const delta = (content) => ({ choices: [{ delta: { content } }] })
const ok = (chunks, options) => new Response(sseBody([...chunks, '[DONE]'], options), { status: 200 })
const candidate = (model) => ({ provider: 'p', label: 'P', model, url: `https://llm.test/${model}`, apiKey: 'k', params: {} })
const PROMPT = { system: 'sys', user: 'user' }

async function collect(iterable) {
  const steps = []
  for await (const step of iterable) steps.push(step)
  return steps
}

describe('buildChain', () => {
  it('orders providers, expands each model and skips providers without a key', () => {
    const chain = buildChain({ GROQ_API_KEY: 'g', LLM_PROVIDERS: 'groq,gemini' })
    expect(chain.map((c) => c.model)).toEqual(['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'])
    expect(chain[0]).toMatchObject({ url: 'https://api.groq.com/openai/v1/chat/completions', params: { reasoning_effort: 'low' } })
    expect(chain[2].params).toEqual({})
  })

  it('reads model overrides and needs no key for local Ollama', () => {
    const chain = buildChain({ LLM_PROVIDERS: 'ollama, gemini', OLLAMA_MODEL: 'llama3.2', GEMINI_API_KEY: 'x', GEMINI_MODELS: 'a, b' })
    expect(chain.map((c) => `${c.provider}:${c.model}`)).toEqual(['ollama:llama3.2', 'gemini:a', 'gemini:b'])
    expect(chain[0].url).toBe('http://localhost:11434/v1/chat/completions')
  })

  it('is empty when nothing is configured', () => {
    expect(buildChain({})).toEqual([])
  })
})

describe('readChatStream', () => {
  it('parses data lines split across network chunks and stops at [DONE]', async () => {
    const body = sseBody([delta('Port '), delta('Louis'), '[DONE]', delta('ignored')], { split: 7 })
    const chunks = await collect(readChatStream(body))
    expect(chunks.map((c) => c.choices[0].delta.content)).toEqual(['Port ', 'Louis'])
  })
})

describe('createThinkFilter', () => {
  it('removes inline <think> blocks even when tags are split across pieces', () => {
    const filter = createThinkFilter()
    const pieces = ['<thi', 'nk>plan the', ' answer</th', 'ink>Le Pouce ', 'is 812 m.']
    expect(pieces.map(filter).join('')).toBe('Le Pouce is 812 m.')
  })

  it('passes ordinary text and lone angle brackets through', () => {
    const filter = createThinkFilter()
    expect(['a < b', ' and <tag>'].map(filter).join('')).toBe('a < b and <tag>')
  })
})

describe('streamChain', () => {
  it('commits to the first provider that streams and reports usage', async () => {
    const fetchImpl = vi.fn(async () => ok([delta('Hi'), delta(' there'), { choices: [], usage: { prompt_tokens: 9, completion_tokens: 2 } }]))
    const steps = await collect(streamChain([candidate('a'), candidate('b')], PROMPT, { fetchImpl }))
    expect(steps.map((s) => s.type)).toEqual(['start', 'text', 'text', 'usage'])
    expect(steps[0].candidate.model).toBe('a')
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body)
    expect(body).toMatchObject({ model: 'a', stream: true, messages: [{ role: 'system', content: 'sys' }, { role: 'user', content: 'user' }] })
  })

  it('fails over on rate limits and empty answers', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response('slow down', { status: 429 }))
      .mockResolvedValueOnce(ok([delta('')]))
      .mockResolvedValueOnce(ok([delta('From C')]))
    const steps = await collect(streamChain([candidate('a'), candidate('b'), candidate('c')], PROMPT, { fetchImpl }))
    expect(steps.filter((s) => s.type === 'attempt-failed').map((s) => [s.candidate.model, s.reason])).toEqual([
      ['a', 'rate-limited'],
      ['b', 'empty answer'],
    ])
    expect(steps.find((s) => s.type === 'start').candidate.model).toBe('c')
  })

  it('skips a provider that does not start streaming in time', async () => {
    const fetchImpl = vi.fn(async (url, { signal }) =>
      url.endsWith('/slow')
        ? new Promise((_, reject) => signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))))
        : ok([delta('fast')])
    )
    const steps = await collect(streamChain([candidate('slow'), candidate('fast')], PROMPT, { fetchImpl, firstTokenTimeoutMs: 20 }))
    expect(steps[0]).toMatchObject({ type: 'attempt-failed', reason: 'no answer within 0.02 s' })
    expect(steps.find((s) => s.type === 'start').candidate.model).toBe('fast')
  })

  it('reports unavailable when every provider fails', async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 503 }))
    const steps = await collect(streamChain([candidate('a'), candidate('b')], PROMPT, { fetchImpl }))
    expect(steps.map((s) => s.reason ?? s.type)).toEqual(['provider error', 'provider error', 'unavailable'])
  })

  it('does not switch provider once text has been shown', async () => {
    // Delivers one chunk, then the connection drops on the next read.
    let reads = 0
    const broken = new ReadableStream({
      pull(controller) {
        reads += 1
        if (reads === 1) controller.enqueue(encoder.encode(`data: ${JSON.stringify(delta('Half an'))}\n\n`))
        else controller.error(new Error('connection reset'))
      },
    })
    const fetchImpl = vi.fn().mockResolvedValueOnce(new Response(broken, { status: 200 }))
    const iterator = streamChain([candidate('a'), candidate('b')], PROMPT, { fetchImpl })
    await expect(collect(iterator)).rejects.toThrow('connection reset')
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})
