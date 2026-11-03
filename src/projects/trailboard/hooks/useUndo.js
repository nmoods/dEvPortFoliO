import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'

const STACK_EVENTS = ['stack-item-added', 'stack-item-popped', 'stack-cleared']

export function useUndo(undoManager) {
  const snapshotRef = useRef({ canUndo: false, canRedo: false })

  const subscribe = useCallback(
    (onChange) => {
      const handleChange = () => {
        const canUndo = undoManager.canUndo()
        const canRedo = undoManager.canRedo()
        const previous = snapshotRef.current
        if (previous.canUndo !== canUndo || previous.canRedo !== canRedo) {
          snapshotRef.current = { canUndo, canRedo }
          onChange()
        }
      }
      handleChange()
      STACK_EVENTS.forEach((name) => undoManager.on(name, handleChange))
      return () => STACK_EVENTS.forEach((name) => undoManager.off(name, handleChange))
    },
    [undoManager]
  )

  const state = useSyncExternalStore(subscribe, () => snapshotRef.current)
  const undo = useCallback(() => undoManager.undo(), [undoManager])
  const redo = useCallback(() => undoManager.redo(), [undoManager])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!(event.ctrlKey || event.metaKey) || isEditable(event.target)) return
      const key = event.key.toLowerCase()
      if (key === 'z' && !event.shiftKey) {
        event.preventDefault()
        undo()
      } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
        event.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  return { ...state, undo, redo }
}

function isEditable(target) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA)$/.test(target.tagName))
}
