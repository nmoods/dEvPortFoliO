import { memo, useEffect, useLayoutEffect, useRef } from 'react'
import { BOARD_HEIGHT, BOARD_WIDTH, NOTE_HEIGHT, NOTE_WIDTH, deleteShape, moveNote, setNoteText } from '../collab/board'
import { diffText, transformIndex } from '../collab/textDiff'

const toPercent = (value, total) => `${(value / total) * 100}%`

function StickyNote({ note, board, undoManager, autoFocus, toBoardPoint }) {
  const textareaRef = useRef(null)
  const dragRef = useRef(null)

  // Apply remote text without losing the local caret: shift the selection through the same splice.
  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (textarea.value === note.text) return
    const splice = diffText(textarea.value, note.text)
    const isFocused = document.activeElement === textarea
    const { selectionStart, selectionEnd } = textarea
    textarea.value = note.text
    if (isFocused) {
      textarea.setSelectionRange(transformIndex(selectionStart, splice), transformIndex(selectionEnd, splice))
    }
  }, [note.text])

  useEffect(() => {
    if (autoFocus) textareaRef.current.focus()
  }, [autoFocus])

  const handleInput = (event) => setNoteText(board, note.id, event.target.value)

  const handleDragStart = (event) => {
    if (event.button !== 0 || event.target.closest('button')) return
    event.currentTarget.setPointerCapture(event.pointerId)
    undoManager.stopCapturing()
    const point = toBoardPoint(event)
    dragRef.current = { offsetX: point.x - note.x, offsetY: point.y - note.y }
  }

  const handleDragMove = (event) => {
    if (!dragRef.current) return
    const point = toBoardPoint(event)
    moveNote(board, note.id, { x: point.x - dragRef.current.offsetX, y: point.y - dragRef.current.offsetY })
  }

  const handleDragEnd = () => {
    dragRef.current = null
    undoManager.stopCapturing()
  }

  return (
    <div
      className="tb-note"
      style={{
        left: toPercent(note.x, BOARD_WIDTH),
        top: toPercent(note.y, BOARD_HEIGHT),
        width: toPercent(NOTE_WIDTH, BOARD_WIDTH),
        height: toPercent(NOTE_HEIGHT, BOARD_HEIGHT),
        '--note-color': note.color,
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div
        className="tb-note__handle"
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
      >
        <span className="tb-note__author">{note.author}</span>
        <button
          type="button"
          className="tb-note__delete"
          onClick={() => deleteShape(board, note.id)}
          aria-label={`Delete note by ${note.author}`}
        >
          ×
        </button>
      </div>
      <textarea
        ref={textareaRef}
        className="tb-note__text"
        defaultValue={note.text}
        onInput={handleInput}
        aria-label={`Sticky note by ${note.author}`}
        placeholder="Type…"
        spellCheck={false}
      />
    </div>
  )
}

export default memo(StickyNote)
