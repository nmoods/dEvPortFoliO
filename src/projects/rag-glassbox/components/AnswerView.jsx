import { Button } from '@nmoods/basecamp-ui'
import { splitCitations } from '../pipeline/prompt'

export function AnswerView({ answer, stale, canGenerate, onGenerate, onCite }) {
  const { status, text, request } = answer
  return (
    <section className="rag-answer" aria-labelledby="rag-answer-title" aria-busy={status === 'streaming'}>
      <div className="rag-answer__head">
        <h2 id="rag-answer-title" className="rag-panel-title">
          Answer
        </h2>
        {answer.model && <code className="rag-answer__model">{answer.model}</code>}
      </div>

      {status === 'idle' && <p className="rag-empty">Ask a question: Claude answers from the retrieved chunks only.</p>}

      {text && (
        <p className="rag-answer__text" aria-live="polite">
          {splitCitations(text).map((part, i) =>
            part.type === 'text' ? (
              part.value
            ) : (
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
            )
          )}
          {status === 'streaming' && <span className="rag-caret" aria-hidden="true" />}
        </p>
      )}
      {status === 'streaming' && !text && <p className="rag-empty">Claude is reading the sources…</p>}

      {answer.fallback && (
        <p className="rag-note">
          A safety classifier declined on {answer.fallback.from}; the API continued on {answer.fallback.to}.
        </p>
      )}
      {status === 'disabled' && (
        <div className="rag-note">
          <strong>Generation is off on this deployment.</strong> Every stage up to the prompt still runs in your browser; open the
          Prompt tab to see exactly what Claude would receive.
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
