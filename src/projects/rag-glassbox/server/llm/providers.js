// Free LLM providers, all reached through the same OpenAI-compatible Chat Completions API.
// Order = priority: the fastest free tier first, the larger daily allowance as backup.
// Every model id is overridable from the environment, because free catalogues change often.

export const PROVIDERS = {
  groq: {
    label: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    keyEnv: 'GROQ_API_KEY',
    modelsEnv: 'GROQ_MODELS',
    // Each Groq model has its own free daily quota, so the three models are three separate budgets.
    models: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'],
    // gpt-oss reasons before answering; "low" keeps that short so the first word arrives fast.
    params: (model) => (model.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low' } : {}),
  },
  gemini: {
    label: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    keyEnv: 'GEMINI_API_KEY',
    modelsEnv: 'GEMINI_MODELS',
    // Flash-Lite has the large free daily allowance; the "-latest" alias follows Google's current version.
    models: ['gemini-flash-lite-latest'],
    params: () => ({}),
  },
  ollama: {
    label: 'Ollama (local)',
    baseUrl: 'http://localhost:11434/v1',
    baseUrlEnv: 'OLLAMA_BASE_URL',
    keyEnv: null,
    modelsEnv: 'OLLAMA_MODEL',
    models: ['qwen3.5:4b'],
    // Measured locally: thinking took 27 s for a one-line answer, 1.8 s without. Grounded Q&A doesn't need it.
    params: () => ({ reasoning_effort: 'none' }),
  },
}

export const DEFAULT_CHAIN = 'groq,gemini'

const splitList = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

/**
 * The ordered list of { provider, label, model, url, apiKey, params } to try, from environment variables.
 * Providers that need a key and have none are skipped, so an empty list means generation is off.
 */
export function buildChain(env = process.env) {
  return splitList((env.LLM_PROVIDERS || DEFAULT_CHAIN).toLowerCase())
    .filter((name) => PROVIDERS[name])
    .flatMap((name) => {
      const provider = PROVIDERS[name]
      const apiKey = provider.keyEnv ? env[provider.keyEnv] : 'ollama'
      if (!apiKey) return []
      const baseUrl = (provider.baseUrlEnv && env[provider.baseUrlEnv]) || provider.baseUrl
      const models = env[provider.modelsEnv] ? splitList(env[provider.modelsEnv]) : provider.models
      return models.map((model) => ({
        provider: name,
        label: provider.label,
        model,
        url: `${baseUrl.replace(/\/$/, '')}/chat/completions`,
        apiKey,
        params: provider.params(model),
      }))
    })
}
