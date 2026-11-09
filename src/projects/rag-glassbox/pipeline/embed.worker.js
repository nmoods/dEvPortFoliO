// Stage 3 of RAG: embed the question, in a Web Worker so the ~23 MB model download and the
// ONNX inference never block the main thread. Same model and precision as the build script.
import { env, pipeline } from '@huggingface/transformers'
import { EMBEDDING_DTYPE, EMBEDDING_MODEL, EMBEDDING_OPTIONS } from './model'

env.allowLocalModels = false

let extractor = null
const files = new Map()

function load() {
  extractor ??= pipeline('feature-extraction', EMBEDDING_MODEL, {
    dtype: EMBEDDING_DTYPE,
    progress_callback: (event) => {
      if (event.status !== 'progress' || !event.total) return
      files.set(event.file, { loaded: event.loaded, total: event.total })
      let loaded = 0
      let total = 0
      for (const file of files.values()) {
        loaded += file.loaded
        total += file.total
      }
      self.postMessage({ type: 'progress', loaded, total })
    },
  }).then(
    (ready) => {
      self.postMessage({ type: 'ready' })
      return ready
    },
    (error) => {
      extractor = null
      self.postMessage({ type: 'error', message: String(error?.message ?? error) })
      throw error
    }
  )
  return extractor
}

self.onmessage = async ({ data }) => {
  if (data.type === 'load') {
    load().catch(() => {})
    return
  }
  if (data.type === 'embed') {
    try {
      const embed = await load()
      const started = performance.now()
      const output = await embed(data.text, EMBEDDING_OPTIONS)
      self.postMessage({ type: 'vector', id: data.id, vector: output.data, ms: performance.now() - started })
    } catch (error) {
      self.postMessage({ type: 'vector-error', id: data.id, message: String(error?.message ?? error) })
    }
  }
}
