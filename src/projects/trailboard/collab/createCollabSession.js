import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'
import { IndexeddbPersistence } from 'y-indexeddb'
import { BroadcastChannelProvider } from './BroadcastChannelProvider'
import { LOCAL_ORIGIN, createBoard } from './board'
import { ShapeStore } from './ShapeStore'

export function createCollabSession({ roomName, user, persist = true }) {
  const doc = new Y.Doc()
  const board = createBoard(doc, LOCAL_ORIGIN)

  const awareness = new Awareness(doc)
  awareness.setLocalStateField('user', user)

  const persistence = persist ? new IndexeddbPersistence(roomName, doc) : null
  const provider = new BroadcastChannelProvider(roomName, doc, awareness)
  const undoManager = new Y.UndoManager(board.shapes, { trackedOrigins: new Set([LOCAL_ORIGIN]) })
  const store = new ShapeStore(board.shapes)

  provider.connect()

  return {
    doc,
    board,
    user,
    awareness,
    provider,
    persistence,
    undoManager,
    store,
    destroy() {
      store.destroy()
      undoManager.destroy()
      provider.destroy()
      awareness.destroy()
      persistence?.destroy()
      doc.destroy()
    },
  }
}
