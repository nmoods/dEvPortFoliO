import * as Y from 'yjs'
import { diffText } from './textDiff'

export const BOARD_WIDTH = 1600
export const BOARD_HEIGHT = 1000
export const NOTE_WIDTH = 220
export const NOTE_HEIGHT = 160

export const ShapeType = {
  STROKE: 'stroke',
  NOTE: 'note',
}

// Every local edit uses this origin so the UndoManager only reverts our own changes.
export const LOCAL_ORIGIN = Symbol('trailboard-local')

const createId = () => globalThis.crypto.randomUUID()

const transact = (board, change) => board.doc.transact(change, board.origin)

export function createBoard(doc, origin = LOCAL_ORIGIN) {
  return { doc, shapes: doc.getMap('shapes'), origin }
}

export function startStroke(board, { color, width, point, author }) {
  const id = createId()
  transact(board, () => {
    const stroke = new Y.Map()
    stroke.set('type', ShapeType.STROKE)
    stroke.set('color', color)
    stroke.set('width', width)
    stroke.set('author', author)
    stroke.set('createdAt', Date.now())
    const points = new Y.Array()
    points.push([point.x, point.y])
    stroke.set('points', points)
    board.shapes.set(id, stroke)
  })
  return id
}

export function extendStroke(board, id, points) {
  const stroke = board.shapes.get(id)
  if (!stroke || points.length === 0) return
  transact(board, () => {
    stroke.get('points').push(points.flatMap((point) => [point.x, point.y]))
  })
}

export function addNote(board, { x, y, color, author, text = '' }) {
  const id = createId()
  transact(board, () => {
    const note = new Y.Map()
    note.set('type', ShapeType.NOTE)
    note.set('x', clamp(x, 0, BOARD_WIDTH - NOTE_WIDTH))
    note.set('y', clamp(y, 0, BOARD_HEIGHT - NOTE_HEIGHT))
    note.set('color', color)
    note.set('author', author)
    note.set('createdAt', Date.now())
    note.set('text', new Y.Text(text))
    board.shapes.set(id, note)
  })
  return id
}

export function moveNote(board, id, { x, y }) {
  const note = board.shapes.get(id)
  if (!note) return
  transact(board, () => {
    note.set('x', clamp(x, 0, BOARD_WIDTH - NOTE_WIDTH))
    note.set('y', clamp(y, 0, BOARD_HEIGHT - NOTE_HEIGHT))
  })
}

export function setNoteText(board, id, nextText) {
  const text = board.shapes.get(id)?.get('text')
  if (!text) return
  const { index, deleteCount, insert } = diffText(text.toString(), nextText)
  if (deleteCount === 0 && insert === '') return
  transact(board, () => {
    if (deleteCount > 0) text.delete(index, deleteCount)
    if (insert) text.insert(index, insert)
  })
}

export function insertNoteText(board, id, index, insert) {
  const text = board.shapes.get(id)?.get('text')
  if (!text) return
  transact(board, () => text.insert(Math.min(index, text.length), insert))
}

export function deleteShape(board, id) {
  if (!board.shapes.has(id)) return
  transact(board, () => board.shapes.delete(id))
}

export function clearBoard(board) {
  transact(board, () => board.shapes.clear())
}

export function toPlainShape(id, shape) {
  const base = {
    id,
    type: shape.get('type'),
    color: shape.get('color'),
    author: shape.get('author'),
    createdAt: shape.get('createdAt') ?? 0,
  }
  if (base.type === ShapeType.STROKE) {
    return { ...base, width: shape.get('width'), points: shape.get('points').toArray() }
  }
  return { ...base, x: shape.get('x'), y: shape.get('y'), text: shape.get('text').toString() }
}

export function findStrokeNear(shapes, point, radius) {
  const radiusSquared = radius * radius
  for (let i = shapes.length - 1; i >= 0; i -= 1) {
    const shape = shapes[i]
    if (shape.type !== ShapeType.STROKE) continue
    const { points } = shape
    for (let p = 0; p < points.length; p += 2) {
      const dx = points[p] - point.x
      const dy = points[p + 1] - point.y
      if (dx * dx + dy * dy <= radiusSquared) return shape.id
    }
  }
  return null
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}
