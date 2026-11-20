import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const basecampSource = fileURLToPath(new URL('./packages/basecamp-ui/src/index.js', import.meta.url))
const ANSWER_HANDLER = '/src/projects/rag-glassbox/server/answerHandler.js'

/**
 * In `npm run dev`, serve POST /api/answer with the same handler Vercel runs in production,
 * so the RAG demo works without the Vercel CLI. Loaded through Vite, so edits hot-reload.
 */
function ragAnswerApi() {
  let handler = null
  let handlerModule = null

  return {
    name: 'rag-answer-api',
    configureServer(server) {
      server.middlewares.use('/api/answer', async (req, res, next) => {
        if (req.method !== 'POST') return next()
        try {
          const mod = await server.ssrLoadModule(ANSWER_HANDLER)
          if (mod !== handlerModule) {
            handlerModule = mod
            handler = mod.createAnswerHandler()
          }

          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          const abort = new AbortController()
          res.on('close', () => abort.abort())

          const response = await handler(
            new Request(`http://localhost${req.originalUrl}`, {
              method: 'POST',
              headers: { 'content-type': req.headers['content-type'] ?? 'application/json' },
              body: Buffer.concat(chunks),
              signal: abort.signal,
            })
          )

          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          if (response.body) for await (const chunk of response.body) res.write(chunk)
          res.end()
        } catch (error) {
          next(error)
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Server-only settings from .env.local (no VITE_ prefix, so they never reach the client bundle).
  const env = loadEnv(mode, process.cwd(), '')
  const SERVER_ENV = ['LLM_PROVIDERS', 'GROQ_API_KEY', 'GROQ_MODELS', 'GEMINI_API_KEY', 'GEMINI_MODELS', 'OLLAMA_BASE_URL', 'OLLAMA_MODEL', 'LLM_FIRST_TOKEN_TIMEOUT_MS']
  for (const name of SERVER_ENV) if (env[name]) process.env[name] ??= env[name]

  return {
    plugins: [react(), ragAnswerApi()],
    resolve: {
      // Consume the workspace package from source so edits hot-reload without a library rebuild.
      alias: [{ find: /^@nmoods\/basecamp-ui$/, replacement: basecampSource }],
    },
    // transformers.js ships its own WASM loader; pre-bundling it breaks the worker's asset URLs.
    optimizeDeps: { exclude: ['@huggingface/transformers'] },
    worker: { format: 'es' },
    test: {
      exclude: ['**/node_modules/**', 'packages/**'],
    },
  }
})
