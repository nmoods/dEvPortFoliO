import { useSyncExternalStore } from 'react'

export function useShapes(store) {
  return useSyncExternalStore(store.subscribe, store.getSnapshot)
}
