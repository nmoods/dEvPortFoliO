// Smallest single splice turning `previous` into `next` (common prefix + common suffix).
export function diffText(previous, next) {
  const shortest = Math.min(previous.length, next.length)
  let start = 0
  while (start < shortest && previous[start] === next[start]) start += 1

  let previousEnd = previous.length
  let nextEnd = next.length
  while (previousEnd > start && nextEnd > start && previous[previousEnd - 1] === next[nextEnd - 1]) {
    previousEnd -= 1
    nextEnd -= 1
  }

  return { index: start, deleteCount: previousEnd - start, insert: next.slice(start, nextEnd) }
}

// Moves a caret position so it stays on the same character after a splice is applied.
export function transformIndex(position, { index, deleteCount, insert }) {
  if (position <= index) return position
  if (position >= index + deleteCount) return position - deleteCount + insert.length
  return index + insert.length
}
