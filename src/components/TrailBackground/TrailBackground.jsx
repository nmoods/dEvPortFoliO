import { useMemo } from 'react'
import { ridgeClipPath } from '../../utils/trailShapes'
import './TrailBackground.css'

function TrailBackground({ scrollY }) {
  const farClip = useMemo(() => ridgeClipPath({ peaks: 5, minHeight: 35, maxHeight: 65, seed: 11 }), [])
  const nearClip = useMemo(() => ridgeClipPath({ peaks: 7, minHeight: 25, maxHeight: 70, seed: 42 }), [])
  const treeClip = useMemo(() => ridgeClipPath({ peaks: 60, minHeight: 15, maxHeight: 95, seed: 97 }), [])

  const farOffset = Math.max(-40, -scrollY * 0.02)
  const nearOffset = Math.max(-70, -scrollY * 0.04)
  const treeOffset = Math.max(-100, -scrollY * 0.07)

  return (
    <div className="trail-bg" aria-hidden="true">
      <div className="trail-bg__sky" />
      <div className="trail-bg__sun" />

      <div className="trail-bg__cloud trail-bg__cloud--1" />
      <div className="trail-bg__cloud trail-bg__cloud--2" />
      <div className="trail-bg__cloud trail-bg__cloud--3" />

      <div
        className="trail-bg__layer trail-bg__layer--far"
        style={{ clipPath: farClip, transform: `translateY(${farOffset}px)` }}
      />
      <div
        className="trail-bg__layer trail-bg__layer--near"
        style={{ clipPath: nearClip, transform: `translateY(${nearOffset}px)` }}
      />
      <div
        className="trail-bg__layer trail-bg__layer--trees"
        style={{ clipPath: treeClip, transform: `translateY(${treeOffset}px)` }}
      />
    </div>
  )
}

export default TrailBackground
