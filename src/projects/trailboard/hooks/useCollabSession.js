import { useEffect, useState } from 'react'
import { createCollabSession } from '../collab/createCollabSession'
import { createGuestUser } from '../collab/guestUser'

// The session owns sockets, IndexedDB and timers, so it is created in an effect
// (StrictMode mounts twice; each mount gets its own session and cleans it up).
export function useCollabSession(roomName) {
  const [session, setSession] = useState(null)

  useEffect(() => {
    const created = createCollabSession({ roomName, user: createGuestUser() })
    setSession(created)
    return () => {
      created.destroy()
      setSession(null)
    }
  }, [roomName])

  return session
}
