import * as Y from 'yjs'
import {
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
  removeAwarenessStates,
} from 'y-protocols/awareness'

const MessageType = {
  SYNC_REQUEST: 'sync-request',
  SYNC_REPLY: 'sync-reply',
  UPDATE: 'update',
  AWARENESS: 'awareness',
  AWARENESS_QUERY: 'awareness-query',
  LEAVE: 'leave',
}

/**
 * Syncs a Y.Doc and its Awareness between every tab of the same origin.
 *
 * Handshake (runs on every connect, so offline edits merge on reconnect):
 *   1. A  -> all : SYNC_REQUEST { stateVector(A) }
 *   2. B  -> A   : SYNC_REPLY   { diff(B, A), stateVector(B) }
 *   3. A  -> all : UPDATE       { diff(A, B) }
 * After that, every local transaction is broadcast as an incremental UPDATE.
 */
export class BroadcastChannelProvider {
  constructor(roomName, doc, awareness) {
    this.roomName = roomName
    this.doc = doc
    this.awareness = awareness
    this.channel = null
    this.connected = false
    this.stats = { sent: 0, received: 0, bytesSent: 0, bytesReceived: 0 }
    this.statusListeners = new Set()

    this.handleDocUpdate = (update, origin) => {
      if (origin === this) return
      this.post({ type: MessageType.UPDATE, update })
    }

    this.handleAwarenessUpdate = ({ added, updated, removed }, origin) => {
      if (origin !== 'local') return
      const changedClients = added.concat(updated, removed)
      this.post({
        type: MessageType.AWARENESS,
        update: encodeAwarenessUpdate(this.awareness, changedClients),
      })
    }

    this.handlePageHide = () => this.post({ type: MessageType.LEAVE })
  }

  connect() {
    if (this.connected) return
    this.channel = new BroadcastChannel(this.roomName)
    this.channel.onmessage = (event) => this.handleMessage(event.data)
    this.connected = true

    this.doc.on('update', this.handleDocUpdate)
    this.awareness.on('update', this.handleAwarenessUpdate)
    globalThis.addEventListener?.('pagehide', this.handlePageHide)

    this.post({ type: MessageType.SYNC_REQUEST, stateVector: Y.encodeStateVector(this.doc) })
    // Re-setting the local state bumps its clock, so peers that dropped us accept it again.
    this.awareness.setLocalState(this.awareness.getLocalState())
    this.post({ type: MessageType.AWARENESS_QUERY })
    this.emitStatus()
  }

  disconnect() {
    if (!this.connected) return
    this.post({ type: MessageType.LEAVE })

    this.doc.off('update', this.handleDocUpdate)
    this.awareness.off('update', this.handleAwarenessUpdate)
    globalThis.removeEventListener?.('pagehide', this.handlePageHide)

    this.channel.close()
    this.channel = null
    this.connected = false

    const remoteClients = [...this.awareness.getStates().keys()].filter(
      (clientID) => clientID !== this.doc.clientID
    )
    this.forgetClients(remoteClients)
    this.emitStatus()
  }

  destroy() {
    this.disconnect()
    this.statusListeners.clear()
  }

  onStatus(listener) {
    this.statusListeners.add(listener)
    return () => this.statusListeners.delete(listener)
  }

  emitStatus() {
    this.statusListeners.forEach((listener) => listener({ connected: this.connected }))
  }

  post(message) {
    if (!this.connected) return
    const payload = { ...message, from: this.doc.clientID }
    this.channel.postMessage(payload)
    this.stats.sent += 1
    this.stats.bytesSent += payloadSize(payload)
  }

  handleMessage(message) {
    if (message.from === this.doc.clientID) return
    if (message.to !== undefined && message.to !== this.doc.clientID) return

    this.stats.received += 1
    this.stats.bytesReceived += payloadSize(message)

    switch (message.type) {
      case MessageType.SYNC_REQUEST:
        this.post({
          type: MessageType.SYNC_REPLY,
          to: message.from,
          update: Y.encodeStateAsUpdate(this.doc, message.stateVector),
          stateVector: Y.encodeStateVector(this.doc),
        })
        break
      case MessageType.SYNC_REPLY:
        Y.applyUpdate(this.doc, message.update, this)
        this.post({
          type: MessageType.UPDATE,
          update: Y.encodeStateAsUpdate(this.doc, message.stateVector),
        })
        break
      case MessageType.UPDATE:
        Y.applyUpdate(this.doc, message.update, this)
        break
      case MessageType.AWARENESS:
        applyAwarenessUpdate(this.awareness, message.update, this)
        break
      case MessageType.AWARENESS_QUERY:
        this.post({
          type: MessageType.AWARENESS,
          to: message.from,
          update: encodeAwarenessUpdate(this.awareness, [this.doc.clientID]),
        })
        break
      case MessageType.LEAVE:
        this.forgetClients([message.from])
        break
      default:
        break
    }
  }

  // Dropping the clock metadata lets a returning peer's state be accepted at any clock.
  forgetClients(clientIDs) {
    removeAwarenessStates(this.awareness, clientIDs, this)
    clientIDs.forEach((clientID) => this.awareness.meta.delete(clientID))
  }
}

function payloadSize(message) {
  return message.update?.byteLength ?? message.stateVector?.byteLength ?? 0
}
