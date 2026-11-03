import { afterEach, describe, expect, it } from 'vitest'
import { createCollabSession } from './createCollabSession'
import { addNote, extendStroke, setNoteText, startStroke, toPlainShape } from './board'

const sessions = []
let roomCounter = 0

function createPeers(count) {
  const roomName = `test-room-${roomCounter++}`
  return Array.from({ length: count }, (_, index) => {
    const session = createCollabSession({
      roomName,
      user: { name: `Peer ${index}`, color: '#000' },
      persist: false,
    })
    sessions.push(session)
    return session
  })
}

const boardState = (session) => {
  const plain = {}
  session.board.shapes.forEach((shape, id) => {
    const { createdAt: _createdAt, ...rest } = toPlainShape(id, shape)
    plain[id] = rest
  })
  return plain
}

async function waitFor(assertion, timeout = 1000) {
  const deadline = Date.now() + timeout
  for (;;) {
    try {
      assertion()
      return
    } catch (error) {
      if (Date.now() > deadline) throw error
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }
}

afterEach(() => {
  sessions.splice(0).forEach((session) => session.destroy())
})

describe('Trailboard collaboration', () => {
  it('syncs existing content to a peer that joins later', async () => {
    const [alice] = createPeers(1)
    const noteId = addNote(alice.board, { x: 10, y: 10, color: '#ff0', author: 'alice', text: 'hello' })

    const bob = createCollabSession({
      roomName: alice.provider.roomName,
      user: { name: 'bob', color: '#000' },
      persist: false,
    })
    sessions.push(bob)

    await waitFor(() => expect(bob.board.shapes.get(noteId)?.get('text').toString()).toBe('hello'))
  })

  it('streams stroke points to peers while drawing', async () => {
    const [alice, bob] = createPeers(2)
    const id = startStroke(alice.board, { color: '#000', width: 4, point: { x: 0, y: 0 }, author: 'alice' })
    extendStroke(alice.board, id, [{ x: 5, y: 5 }])
    await waitFor(() => expect(bob.board.shapes.get(id)?.get('points').toArray()).toEqual([0, 0, 5, 5]))

    extendStroke(alice.board, id, [{ x: 9, y: 9 }])
    await waitFor(() => expect(bob.board.shapes.get(id).get('points').length).toBe(6))
  })

  it('merges concurrent typing in the same sticky note', async () => {
    const [alice, bob] = createPeers(2)
    const id = addNote(alice.board, { x: 0, y: 0, color: '#ff0', author: 'alice', text: 'trail' })
    await waitFor(() => expect(bob.board.shapes.has(id)).toBe(true))

    alice.provider.disconnect()
    setNoteText(alice.board, id, 'trail map')
    setNoteText(bob.board, id, 'the trail')
    alice.provider.connect()

    await waitFor(() => expect(boardState(alice)).toEqual(boardState(bob)))
    expect(alice.board.shapes.get(id).get('text').toString()).toBe('the trail map')
  })

  it('merges edits made while offline on reconnect', async () => {
    const [alice, bob, carol] = createPeers(3)
    bob.provider.disconnect()

    addNote(alice.board, { x: 0, y: 0, color: '#ff0', author: 'alice', text: 'online edit' })
    addNote(bob.board, { x: 50, y: 50, color: '#ff0', author: 'bob', text: 'offline edit' })
    await waitFor(() => expect(carol.board.shapes.size).toBe(1))

    bob.provider.connect()

    await waitFor(() => {
      expect(alice.board.shapes.size).toBe(2)
      expect(boardState(alice)).toEqual(boardState(bob))
      expect(boardState(carol)).toEqual(boardState(bob))
    })
  })

  it('shares cursors, drops them on disconnect and restores them on reconnect', async () => {
    const [alice, bob] = createPeers(2)
    alice.awareness.setLocalStateField('cursor', { x: 1, y: 2 })
    await waitFor(() => expect(bob.awareness.getStates().get(alice.doc.clientID)?.cursor).toEqual({ x: 1, y: 2 }))

    alice.provider.disconnect()
    await waitFor(() => expect(bob.awareness.getStates().has(alice.doc.clientID)).toBe(false))
    expect(alice.awareness.getStates().has(bob.doc.clientID)).toBe(false)

    alice.provider.connect()
    await waitFor(() => {
      expect(bob.awareness.getStates().get(alice.doc.clientID)?.user.name).toBe('Peer 0')
      expect(alice.awareness.getStates().get(bob.doc.clientID)?.user.name).toBe('Peer 1')
    })
  })

  it('undo only reverts the local user’s changes', async () => {
    const [alice, bob] = createPeers(2)
    const aliceNote = addNote(alice.board, { x: 0, y: 0, color: '#ff0', author: 'alice' })
    const bobNote = addNote(bob.board, { x: 0, y: 0, color: '#ff0', author: 'bob' })
    await waitFor(() => expect(alice.board.shapes.size).toBe(2))

    alice.undoManager.undo()

    await waitFor(() => {
      expect(bob.board.shapes.has(aliceNote)).toBe(false)
      expect(bob.board.shapes.has(bobNote)).toBe(true)
    })
  })
})
