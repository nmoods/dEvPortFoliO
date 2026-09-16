import { useMemo } from 'react'
import './Confetti.css'

const COLORS = ['#2dd4bf', '#facc15', '#fb923c', '#f472b6', '#60a5fa']

function Confetti({ active }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.2 + Math.random() * 1.4,
        color: COLORS[i % COLORS.length],
        rotate: Math.random() * 360,
        drift: (Math.random() - 0.5) * 120,
      })),
    []
  )

  if (!active) return null

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="confetti__piece"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            backgroundColor: piece.color,
            '--rotate': `${piece.rotate}deg`,
            '--drift': `${piece.drift}px`,
          }}
        />
      ))}
    </div>
  )
}

export default Confetti
