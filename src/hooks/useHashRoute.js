import { useSyncExternalStore } from 'react'

const subscribe = (onChange) => {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

export function useHashRoute() {
  return useSyncExternalStore(subscribe, () => window.location.hash)
}
