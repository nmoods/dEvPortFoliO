import { trailSlot } from '../content'
import { tokenize } from '../pipeline/bm25'
import { chunkDomId } from '../pipeline/chunk'

/** Marks the words BM25 matched, so keyword evidence is visible, not just a number. */
function Highlighted({ text, terms }) {
  if (terms.size === 0) return text
  return text.split(/([\p{L}\p{N}][\p{L}\p{N}'’-]*)/u).map((part, i) =>
    i % 2 === 1 && tokenize(part).some((token) => terms.has(token)) ? <mark key={i}>{part}</mark> : part
  )
}

function ChunkCard({ result, chunk, terms, mode, label, muted }) {
  const overlap = chunk.text.slice(0, chunk.overlapChars)
  const rest = chunk.text.slice(chunk.overlapChars)
  return (
    <li id={chunkDomId(chunk.id)} className={`rag-chunk${muted ? ' rag-chunk--muted' : ''}`} tabIndex={-1}>
      <div className="rag-chunk__head">
        {label ? <span className="rag-chunk__cite">[{label}]</span> : <span className="rag-chunk__rank">#{result.rank}</span>}
        <span className="rag-swatch" style={{ background: `var(--trail-${trailSlot[chunk.docId]})` }} aria-hidden="true" />
        <span className="rag-chunk__title">
          {chunk.title}
          <span className="rag-chunk__section"> · {chunk.sections.join(', ')}</span>
        </span>
        <code className="rag-chunk__id">{chunk.id}</code>
      </div>
      <dl className="rag-chunk__scores">
        <div className={mode === 'vector' ? 'is-active' : undefined}>
          <dt>Cosine</dt>
          <dd>
            <span className="rag-meter" aria-hidden="true">
              <span style={{ width: `${Math.max(0, result.vectorScore) * 100}%` }} />
            </span>
            {result.vectorScore.toFixed(3)} <small>#{result.vectorRank}</small>
          </dd>
        </div>
        <div className={mode === 'keyword' ? 'is-active' : undefined}>
          <dt>BM25</dt>
          <dd>{result.keywordRank ? <>{result.keywordScore.toFixed(2)} <small>#{result.keywordRank}</small></> : <small>no word match</small>}</dd>
        </div>
        {mode === 'hybrid' && (
          <div className="is-active">
            <dt>RRF</dt>
            <dd>{result.score.toFixed(4)}</dd>
          </div>
        )}
      </dl>
      <p className="rag-chunk__text">
        {overlap && (
          <span className="rag-chunk__overlap" title="Repeated from the previous chunk (overlap)">
            {overlap}
          </span>
        )}
        <Highlighted text={rest} terms={terms} />
      </p>
    </li>
  )
}

export function ChunkList({ index, retrieval, mode, question }) {
  if (!retrieval) return <p className="rag-empty">Ask a question to see which chunks are retrieved, and why.</p>
  const terms = new Set(tokenize(question))
  return (
    <div className="rag-chunks">
      <p className="rag-legend-note">
        <mark>Highlighted</mark> words matched the keyword search. <span className="rag-chunk__overlap">Faded text</span> is overlap repeated from the
        previous chunk. Each score shows its rank in brackets.
      </p>
      <ol className="rag-chunk-list" aria-label="Retrieved chunks, sent to Claude">
        {retrieval.top.map((result, i) => (
          <ChunkCard key={result.index} result={result} chunk={index.chunks[result.index]} terms={terms} mode={mode} label={i + 1} />
        ))}
      </ol>
      {retrieval.nearMisses.length > 0 && (
        <>
          <h3 className="rag-subtitle">Just below the cut-off (not sent)</h3>
          <ol className="rag-chunk-list" aria-label="Chunks ranked just below top k">
            {retrieval.nearMisses.map((result) => (
              <ChunkCard key={result.index} result={result} chunk={index.chunks[result.index]} terms={terms} mode={mode} muted />
            ))}
          </ol>
        </>
      )}
    </div>
  )
}
