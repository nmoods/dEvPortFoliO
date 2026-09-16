import { useEffect, useRef, useState } from 'react'
import './TrailProgress.css'

// Winds bottom -> top so the runner ascends toward the summit as the page is scrolled.
const PATH_D =
  'M20 256 C 4 240, 36 224, 20 204 C 4 184, 36 168, 20 148 C 4 128, 36 112, 20 92 C 4 72, 36 56, 20 36 C 8 20, 32 12, 20 4'

function TrailProgress({ progress }) {
  const pathRef = useRef(null)
  const [length, setLength] = useState(0)
  const [point, setPoint] = useState({ x: 20, y: 256 })

  useEffect(() => {
    if (pathRef.current) {
      setLength(pathRef.current.getTotalLength())
    }
  }, [])

  useEffect(() => {
    if (pathRef.current && length) {
      setPoint(pathRef.current.getPointAtLength(length * progress))
    }
  }, [length, progress])

  return (
    <>
      <div className="trail-progress-bar" style={{ width: `${progress * 100}%` }} aria-hidden="true" />

      <div className="trail-progress" aria-hidden="true">
        <svg className="trail-progress__track" viewBox="0 0 40 260" preserveAspectRatio="none">
          <path ref={pathRef} d={PATH_D} className="trail-progress__path-bg" />
          <path
            d={PATH_D}
            className="trail-progress__path-fill"
            style={{
              strokeDasharray: length,
              strokeDashoffset: length - length * progress,
            }}
          />
        </svg>
        <div className="trail-progress__runner" style={{ transform: `translate(${point.x}px, ${point.y}px)` }}>
          🏃
        </div>
        <span className="trail-progress__flag trail-progress__flag--start">🚩</span>
        <span className="trail-progress__flag trail-progress__flag--end">🏔️</span>
      </div>
    </>
  )
}

export default TrailProgress
