const LABEL_HEIGHT = 14
const LABEL_WIDTH = 28

/**
 * Rank labels sit on the side facing away from the question (so they never cover the star), and a label that
 * would overlap one already placed is nudged down until it is clear.
 */
export function placeLabels(points, query) {
  const placed = []
  for (const [x, y] of points) {
    const left = x < query[0]
    const label = { x: left ? x - 10 : x + 10, y: y + 4, anchor: left ? 'end' : 'start' }
    const overlaps = (other) =>
      other.anchor === label.anchor && Math.abs(other.x - label.x) < LABEL_WIDTH && Math.abs(other.y - label.y) < LABEL_HEIGHT
    while (placed.some(overlaps)) label.y += LABEL_HEIGHT
    placed.push(label)
  }
  return placed
}
