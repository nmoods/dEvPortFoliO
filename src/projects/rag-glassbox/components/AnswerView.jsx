import { Button } from '@nmoods/basecamp-ui'
import { formatAnswer } from '../pipeline/answerFormat'

export function AnswerView({ answer, stale, canGenerate, onGenerate, onCite }) {
  const { status, text, request } = answer
  const blocks = text ? formatAnswer(text) : []
  return (
    <section className="rag-answer" aria-labelledby="rag-answer-title" aria-busy={status === 'streaming'}>
      <div className="rag-answer__head">
        <h2 id="rag-answer-title" className="rag-panel-title">
          Answer
        </h2>
        {answer.answeredBy && (
          <code className="rag-answer__model">
            {answer.answeredBy.label} · {answer.answeredBy.model}
          </code>
        )}
      </div>

      {status === 'idle' && <p className="rag-empty">Ask a question: a free LLM answers from the retrieved chunks only.</p>}

      {text && (
        <div className="rag-answer__text" aria-live="polite">
          {blocks.map((block, b) => {
            const caret = status === 'streaming' && b === blocks.length - 1 ? <span className="rag-caret" aria-hidden="true" /> : null
            const renderParts = (parts) =>
              parts.map((part, i) =>
                part.type === 'cite' ? (
                  <button
                    key={i}
                    type="button"
                    className="rag-cite"
                    disabled={!request?.chunkIds[part.n - 1]}
                    onClick={() => onCite(part.n)}
                    aria-label={`Source ${part.n}`}
                  >
                    [{part.n}]
                  </button>
                ) : part.bold ? (
                  <strong key={i}>{part.value}</strong>
                ) : (
                  part.value
                )
              )
            return block.type === 'ul' ? (
              <ul key={b}>
                {block.items.map((item, i) => (
                  <li key={i}>
                    {renderParts(item)}
                    {i === block.items.length - 1 && caret}
                  </li>
                ))}
              </ul>
            ) : (
              <p key={b}>
                {renderParts(block.parts)}
                {caret}
              </p>
            )
          })}
        </div>
      )}
      {status === 'streaming' && !text && <p className="rag-empty">The model is reading the sources…</p>}

      {answer.answeredBy && (answer.status === 'done' || answer.answeredBy.cached) && (
        <p className="rag-answer__meta">
          {answer.answeredBy.cached
            ? 'Served from the cache: this exact question and these sources were answered before, so no model was called.'
            : `First words after ${(answer.answeredBy.firstTokenMs / 1000).toFixed(1)} s${
                answer.usage?.input ? ` · ${answer.usage.input} tokens in, ${answer.usage.output} out` : ''
              }.`}
        </p>
      )}
      {answer.fallbacks.length > 0 && (
        <ul className="rag-answer__fallbacks" aria-label="Models skipped">
          {answer.fallbacks.map((fallback) => (
            <li key={`${fallback.provider}:${fallback.model}`}>
              Skipped {fallback.label} · {fallback.model}: {fallback.reason}
            </li>
          ))}
        </ul>
      )}
      {status === 'disabled' && (
        <div className="rag-note">
          <strong>Generation is off on this deployment.</strong> Every stage up to the prompt still runs in your browser; open the
          Prompt tab to see exactly what the model would receive.
        </div>
      )}
      {status === 'error' && <p className="rag-note rag-note--error">{answer.error}</p>}

      {stale && canGenerate && (
        <div className="rag-answer__stale">
          <p>Retrieval changed since this answer was written, so its citations point to the old sources.</p>
          <Button size="sm" variant="secondary" onClick={onGenerate}>
            Regenerate with these sources
          </Button>
        </div>
      )}
    </section>
  )
}
