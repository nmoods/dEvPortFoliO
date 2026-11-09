import { useMemo, useState } from 'react'
import { TRAILS, trailSlot } from '../content'

const WIDTH = 640
const HEIGHT = 400
const PAD = 28

/** PCA projection of every chunk embedding, with the question placed on the same two axes. */
export function EmbeddingMap({ index, retrieval }) {
  const [hovered, setHovered] = useState(null)

  const scale = useMemo(() => {
    if (!index) return null
    const xs = index.points.map(([x]) => x)
    const ys = index.points.map(([, y]) => y)
    const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
    return ([x, y]) => [
      clamp(PAD + ((x - minX) / (maxX - minX || 1)) * (WIDTH - 2 * PAD), 8, WIDTH - 8),
      clamp(HEIGHT - PAD - ((y - minY) / (maxY - minY || 1)) * (HEIGHT - 2 * PAD), 8, HEIGHT - 8),
    ]
  }, [index])

  if (!index) return <p className="rag-empty">Loading the map…</p>

  const topRank = new Map(retrieval?.top.map((result, i) => [result.index, i + 1]) ?? [])
  const query = retrieval ? scale(retrieval.queryPoint) : null
  const hoveredChunk = hovered !== null ? index.chunks[hovered] : null
  const hoveredAt = hovered !== null ? scale(index.points[hovered]) : null

  return (
    <figure className="rag-map">
      <div className="rag-map__plot">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={`Map of ${index.chunks.length} chunks${retrieval ? `; the question sits nearest to ${retrieval.top.length} highlighted chunks` : ''}. The Chunks tab lists the same data.`}
          onPointerLeave={() => setHovered(null)}
        >
          <rect className="rag-map__frame" x="0.5" y="0.5" width={WIDTH - 1} height={HEIGHT - 1} rx="10" />
          {query &&
            retrieval.top.map((result) => {
              const [x, y] = scale(index.points[result.index])
              return <line key={result.index} className="rag-map__link" x1={query[0]} y1={query[1]} x2={x} y2={y} />
            })}
          {index.points.map((point, i) => {
            const [x, y] = scale(point)
            const rank = topRank.get(i)
            const dimmed = retrieval && !rank
            return (
              <g key={index.chunks[i].id} className={dimmed ? 'rag-map__dot is-dimmed' : 'rag-map__dot'}>
                <circle
                  cx={x}
                  cy={y}
                  r={rank ? 7 : 5}
                  fill={`var(--trail-${trailSlot[index.chunks[i].docId]})`}
                  className={rank ? 'rag-map__mark is-top' : 'rag-map__mark'}
                />
                {rank && (
                  // Label on the side facing away from the question, so it never collides with the star.
                  <text
                    x={query && x < query[0] ? x - 10 : x + 10}
                    y={y + 4}
                    textAnchor={query && x < query[0] ? 'end' : 'start'}
                    className="rag-map__label"
                  >
                    [{rank}]
                  </text>
                )}
                <circle cx={x} cy={y} r={11} className="rag-map__hit" onPointerEnter={() => setHovered(i)} />
              </g>
            )
          })}
          {query && (
            <g className="rag-map__query" transform={`translate(${query[0]} ${query[1]})`}>
              <path d="M0 -10 L3 -3 L10 -3 L4.5 1.5 L6.5 9 L0 4.5 L-6.5 9 L-4.5 1.5 L-10 -3 L-3 -3 Z" />
              <text x="12" y="-8">
                your question
              </text>
            </g>
          )}
        </svg>
        {hoveredChunk && (
          <div
            className="rag-map__tooltip"
            style={{ left: `${(hoveredAt[0] / WIDTH) * 100}%`, top: `${(hoveredAt[1] / HEIGHT) * 100}%` }}
            role="status"
          >
            <strong>{hoveredChunk.title}</strong> · {hoveredChunk.sections.join(', ')}
            <span>{hoveredChunk.text.slice(0, 110)}…</span>
          </div>
        )}
      </div>
      <ul className="rag-map__legend" aria-label="Trails">
        {TRAILS.map((trail) => (
          <li key={trail.id}>
            <span className="rag-swatch" style={{ background: `var(--trail-${trail.slot})` }} aria-hidden="true" />
            {trail.title}
          </li>
        ))}
      </ul>
      <figcaption className="rag-map__caption">
        384 dimensions squeezed onto the 2 directions where the chunks differ most (PCA). Chunks about the same trail cluster together.
        Distances here are approximate; retrieval uses all 384 dimensions, so the true top {retrieval?.top.length ?? 'k'} may not look the closest.
      </figcaption>
    </figure>
  )
}
