import { memo, useCallback, useEffect, useRef, useState } from 'react'
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  NOTE_WIDTH,
  ShapeType,
  addNote,
  deleteShape,
  extendStroke,
  findStrokeNear,
  startStroke,
} from '../collab/board'
import { Tool } from './tools'
import StickyNote from './StickyNote'
import PeerCursors from './PeerCursors'

const MIN_POINT_DISTANCE = 2
const ERASER_RADIUS = 14
const STROKE_WIDTH = 4

function Board({ session, shapes, peers, tool, color }) {
  const { board, awareness, undoManager, user } = session
  const surfaceRef = useRef(null)
  const gestureRef = useRef(null)
  const cursorFrameRef = useRef(0)
  const shapesRef = useRef(shapes)
  const [focusNoteId, setFocusNoteId] = useState(null)

  useEffect(() => {
    shapesRef.current = shapes
  }, [shapes])

  useEffect(() => () => cancelAnimationFrame(cursorFrameRef.current), [])

  // Stable identity so memoized sticky notes don't re-render whenever the board does.
  const toBoardPoint = useCallback((event) => {
    const rect = surfaceRef.current.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * BOARD_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * BOARD_HEIGHT,
    }
  }, [])

  const publishCursor = (point) => {
    cancelAnimationFrame(cursorFrameRef.current)
    cursorFrameRef.current = requestAnimationFrame(() => awareness.setLocalStateField('cursor', point))
  }

  const eraseAt = (point) => {
    const id = findStrokeNear(shapesRef.current, point, ERASER_RADIUS)
    if (id) deleteShape(board, id)
  }

  const flushStroke = () => {
    const gesture = gestureRef.current
    if (!gesture?.strokeId || gesture.pending.length === 0) return
    extendStroke(board, gesture.strokeId, gesture.pending)
    gesture.pending = []
    gesture.frame = 0
  }

  const handlePointerDown = (event) => {
    if (event.button !== 0) return
    const point = toBoardPoint(event)

    if (tool === Tool.NOTE) {
      // Prevents the follow-up mousedown from stealing focus from the new note's textarea.
      event.preventDefault()
      undoManager.stopCapturing()
      const id = addNote(board, { x: point.x - NOTE_WIDTH / 2, y: point.y - 20, color: '#fef08a', author: user.name })
      setFocusNoteId(id)
      return
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    undoManager.stopCapturing()

    if (tool === Tool.PEN) {
      const strokeId = startStroke(board, { color, width: STROKE_WIDTH, point, author: user.name })
      gestureRef.current = { strokeId, last: point, pending: [], frame: 0 }
    } else if (tool === Tool.ERASER) {
      gestureRef.current = { erasing: true }
      eraseAt(point)
    }
  }

  const handlePointerMove = (event) => {
    const point = toBoardPoint(event)
    publishCursor(point)

    const gesture = gestureRef.current
    if (!gesture) return
    if (gesture.erasing) {
      eraseAt(point)
      return
    }
    if (Math.hypot(point.x - gesture.last.x, point.y - gesture.last.y) < MIN_POINT_DISTANCE) return
    gesture.last = point
    gesture.pending.push(point)
    if (!gesture.frame) gesture.frame = requestAnimationFrame(flushStroke)
  }

  const endGesture = () => {
    const gesture = gestureRef.current
    if (!gesture) return
    cancelAnimationFrame(gesture.frame)
    flushStroke()
    gestureRef.current = null
    undoManager.stopCapturing()
  }

  const handlePointerLeave = () => {
    cancelAnimationFrame(cursorFrameRef.current)
    awareness.setLocalStateField('cursor', null)
  }

  const strokes = shapes.filter((shape) => shape.type === ShapeType.STROKE)
  const notes = shapes.filter((shape) => shape.type === ShapeType.NOTE)

  return (
    <div className="tb-board__viewport">
      <div
        ref={surfaceRef}
        className={`tb-board tb-board--${tool}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
        onPointerLeave={handlePointerLeave}
        role="application"
        aria-label="Shared whiteboard"
      >
        <svg
          className="tb-board__strokes"
          viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {strokes.map((stroke) => (
            <Stroke key={stroke.id} stroke={stroke} />
          ))}
        </svg>

        {notes.map((note) => (
          <StickyNote
            key={note.id}
            note={note}
            board={board}
            undoManager={undoManager}
            autoFocus={note.id === focusNoteId}
            toBoardPoint={toBoardPoint}
          />
        ))}

        <PeerCursors peers={peers} />

        {shapes.length === 0 && (
          <p className="tb-board__empty">Draw, drop a sticky note, or invite the bot teammate.</p>
        )}
      </div>
    </div>
  )
}

const Stroke = memo(function Stroke({ stroke }) {
  const { points } = stroke
  let d = `M ${points[0]} ${points[1]}`
  for (let i = 2; i < points.length; i += 2) d += ` L ${points[i]} ${points[i + 1]}`
  if (points.length === 2) d += ` l 0.1 0`

  return (
    <path
      d={d}
      fill="none"
      stroke={stroke.color}
      strokeWidth={stroke.width}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
})

export default Board
