// Deterministic pseudo-random ridge line, expressed as a CSS clip-path polygon.
// Reused for mountain silhouettes (few, tall peaks) and the tree line (many, jagged peaks).
export function ridgeClipPath({ peaks = 6, minHeight = 30, maxHeight = 70, seed = 1 } = {}) {
  let s = seed

  const rand = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }

  const points = ['0% 100%']
  const step = 100 / peaks

  for (let i = 0; i <= peaks; i += 1) {
    const x = i * step
    const height = minHeight + rand() * (maxHeight - minHeight)
    points.push(`${x.toFixed(2)}% ${(100 - height).toFixed(2)}%`)
  }

  points.push('100% 100%')
  return `polygon(${points.join(', ')})`
}
