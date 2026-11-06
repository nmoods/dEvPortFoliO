import { useCallback, useRef, useSyncExternalStore } from 'react'

// Remote collaborators (everyone in the awareness map except this tab).
export function usePeers(awareness) {
  const snapshotRef = useRef([])

  const subscribe = useCallback(
    (onChange) => {
      const handleChange = (changes) => {
        // Our own cursor moving does not change the peer list: skip the re-render.
        if (changes && isOnlyLocal(changes, awareness.clientID)) return
        const peers = []
        awareness.getStates().forEach((state, clientID) => {
          if (clientID === awareness.clientID || !state.user) return
          peers.push({ clientID, user: state.user, cursor: state.cursor ?? null })
        })
        snapshotRef.current = peers
        onChange()
      }
      handleChange()
      awareness.on('change', handleChange)
      return () => awareness.off('change', handleChange)
    },
    [awareness]
  )

  return useSyncExternalStore(subscribe, () => snapshotRef.current)
}

function isOnlyLocal({ added, updated, removed }, localClientID) {
  return [...added, ...updated, ...removed].every((clientID) => clientID === localClientID)
}
