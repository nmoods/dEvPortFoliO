import { STAGES } from '../content'

const formatMs = (ms) => (ms < 1 ? '<1 ms' : `${Math.round(ms)} ms`)

/** The five RAG stages with what each one did for the current question. */
export function StageRail({ index, embedder, query, retrieval, embedding, answer, promptChars }) {
  const details = {
    chunk: index ? { state: 'done', note: `${index.chunks.length} chunks · ~${index.words} words` } : { state: 'active', note: 'Loading index…' },
    embed: embedStage(embedder, query, embedding),
    retrieve: retrieval
      ? { state: 'done', note: `${retrieval.top.length} of ${index.chunks.length} · ${formatMs(retrieval.searchMs)}` }
      : { state: 'waiting', note: 'Waiting for a question' },
    augment: retrieval ? { state: 'done', note: `~${Math.round(promptChars / 4)} tokens` } : { state: 'waiting', note: '' },
    generate: generateStage(answer),
  }

  return (
    <ol className="rag-stages" aria-label="Pipeline stages">
      {STAGES.map((stage, i) => {
        const { state, note } = details[stage.id]
        return (
          <li key={stage.id} className={`rag-stage rag-stage--${state}`}>
            <span className="rag-stage__number" aria-hidden="true">
              {i + 1}
            </span>
            <div>
              <p className="rag-stage__title">
                {stage.title}
                <span className="bc-visually-hidden"> ({state})</span>
              </p>
              <p className="rag-stage__body">{stage.body}</p>
              {note && <p className="rag-stage__note">{note}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function embedStage(embedder, query, embedding) {
  if (embedder.status === 'error') return { state: 'error', note: 'Model failed to load' }
  if (embedder.status === 'loading') {
    const percent = embedder.total ? Math.round((embedder.loaded / embedder.total) * 100) : 0
    return { state: 'active', note: `Downloading model… ${percent}%` }
  }
  if (embedding) return { state: 'active', note: 'Embedding…' }
  if (query) return { state: 'done', note: `384 dimensions · ${formatMs(query.embedMs)}` }
  return { state: 'waiting', note: 'Model ready' }
}

function generateStage(answer) {
  switch (answer.status) {
    case 'streaming':
      return { state: 'active', note: 'Streaming…' }
    case 'done':
      return { state: 'done', note: answer.usage ? `${answer.usage.input} in · ${answer.usage.output} out tokens` : 'Done' }
    case 'disabled':
      return { state: 'error', note: 'Disabled (no API key)' }
    case 'error':
      return { state: 'error', note: 'Failed' }
    default:
      return { state: 'waiting', note: '' }
  }
}
