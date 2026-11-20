import { ridgeClipPath } from '../../utils/trailShapes'
import './TrailBackground.css'

// Computed once at module load: the shapes never change.
const RIDGES = [
  { layer: 'far', clip: ridgeClipPath({ peaks: 5, minHeight: 35, maxHeight: 65, seed: 11 }) },
  { layer: 'near', clip: ridgeClipPath({ peaks: 7, minHeight: 25, maxHeight: 70, seed: 42 }) },
  { layer: 'trees', clip: ridgeClipPath({ peaks: 60, minHeight: 15, maxHeight: 95, seed: 97 }) },
]

/**
 * Pure CSS landscape. Every animation only touches `transform` or `opacity` (compositor-only, no repaint),
 * light is drawn with gradients instead of blur filters, and parallax is a scroll-driven CSS animation.
 */
function TrailBackground() {
  return (
    <div className="trail-bg" aria-hidden="true">
      <div className="trail-bg__sky" />
      <div className="trail-bg__stars" />
      <div className="trail-bg__stars trail-bg__stars--late" />
      <div className="trail-bg__glow" />
      <div className="trail-bg__mist trail-bg__mist--high" />
      {RIDGES.map(({ layer, clip }) => (
        <div key={layer} className={`trail-bg__ridge trail-bg__ridge--${layer}`} style={{ clipPath: clip }} />
      ))}
      <div className="trail-bg__mist trail-bg__mist--low" />
    </div>
  )
}

export default TrailBackground
