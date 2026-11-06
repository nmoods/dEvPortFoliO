import { BOARD_HEIGHT, BOARD_WIDTH, addNote, deleteShape, extendStroke, insertNoteText, startStroke } from './board'
import { createCollabSession } from './createCollabSession'

export const BOT_USER = { name: 'Ava (bot)', color: '#d946ef' }

const NOTES = ['Ship it 🚀', 'LGTM ✅', 'a11y pass on the toolbar?', 'Perf budget: 150 kB', 'Pair on this tomorrow?']
const MAX_BOT_SHAPES = 6
const FRAME_MS = 30

const STOPPED = Symbol('stopped')

// A genuine second peer: its own Y.Doc, Awareness and provider, talking over the same channel.
export function startSimulatedPeer({ roomName }) {
  const session = createCollabSession({ roomName, user: BOT_USER, persist: false })
  const { board, awareness } = session
  let active = true
  let cursor = { x: BOARD_WIDTH * 0.8, y: BOARD_HEIGHT * 0.15 }
  let noteIndex = 0

  const ensureActive = () => {
    if (!active) throw STOPPED
  }
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const setCursor = (point) => {
    ensureActive()
    cursor = point
    awareness.setLocalStateField('cursor', point)
  }

  async function glideTo(target, duration = 700) {
    const from = cursor
    const steps = Math.max(1, Math.round(duration / FRAME_MS))
    for (let step = 1; step <= steps; step += 1) {
      const t = easeInOut(step / steps)
      setCursor({ x: from.x + (target.x - from.x) * t, y: from.y + (target.y - from.y) * t })
      await sleep(FRAME_MS)
    }
  }

  async function drawRidge() {
    const start = randomPoint(360, 220)
    const ridge = ridgePoints(start)
    await glideTo(ridge[0])
    ensureActive()
    const id = startStroke(board, { color: BOT_USER.color, width: 4, point: ridge[0], author: BOT_USER.name })
    for (let i = 1; i < ridge.length; i += 1) {
      setCursor(ridge[i])
      extendStroke(board, id, [ridge[i]])
      await sleep(16)
    }
  }

  async function writeNote() {
    const target = randomPoint(260, 200)
    await glideTo(target)
    ensureActive()
    const id = addNote(board, { ...target, color: '#f5d0fe', author: BOT_USER.name })
    const message = NOTES[noteIndex % NOTES.length]
    noteIndex += 1
    for (let i = 0; i < message.length; i += 1) {
      await sleep(70)
      ensureActive()
      insertNoteText(board, id, i, message[i])
    }
  }

  function tidyUp() {
    ensureActive()
    const own = []
    board.shapes.forEach((shape, id) => {
      if (shape.get('author') === BOT_USER.name) own.push({ id, createdAt: shape.get('createdAt') })
    })
    own
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(0, Math.max(0, own.length - MAX_BOT_SHAPES))
      .forEach(({ id }) => deleteShape(board, id))
  }

  async function run() {
    try {
      while (active) {
        await drawRidge()
        await sleep(600)
        await writeNote()
        await sleep(1400)
        tidyUp()
      }
    } catch (error) {
      if (error !== STOPPED) throw error
    }
  }

  run()

  return {
    stop() {
      active = false
      session.destroy()
    },
  }
}

function ridgePoints(start) {
  const peaks = [
    { x: 0, y: 0 },
    { x: 70, y: -110 },
    { x: 120, y: -50 },
    { x: 190, y: -150 },
    { x: 260, y: -40 },
    { x: 320, y: 0 },
  ]
  const points = []
  for (let i = 0; i < peaks.length - 1; i += 1) {
    const a = peaks[i]
    const b = peaks[i + 1]
    for (let s = 0; s < 8; s += 1) {
      const t = s / 8
      points.push({ x: start.x + a.x + (b.x - a.x) * t, y: start.y + 160 + a.y + (b.y - a.y) * t })
    }
  }
  const last = peaks[peaks.length - 1]
  points.push({ x: start.x + last.x, y: start.y + 160 + last.y })
  return points
}

function randomPoint(marginX, marginY) {
  return {
    x: 40 + Math.random() * (BOARD_WIDTH - marginX - 80),
    y: 40 + Math.random() * (BOARD_HEIGHT - marginY - 80),
  }
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}
