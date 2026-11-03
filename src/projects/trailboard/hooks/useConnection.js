import { useCallback, useSyncExternalStore } from 'react'

export function useConnection(provider) {
  const subscribe = useCallback((onChange) => provider.onStatus(onChange), [provider])
  const connected = useSyncExternalStore(subscribe, () => provider.connected)

  const toggle = useCallback(() => {
    if (provider.connected) provider.disconnect()
    else provider.connect()
  }, [provider])

  return { connected, toggle }
}
