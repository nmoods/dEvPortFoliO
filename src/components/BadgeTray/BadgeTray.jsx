import { useEffect, useState } from 'react'
import './BadgeTray.css'

function BadgeTray({ checkpoints, unlocked, lastUnlocked }) {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!lastUnlocked) return undefined
    const checkpoint = checkpoints.find((c) => c.id === lastUnlocked)
    if (!checkpoint) return undefined
    setToast(checkpoint)
    const timer = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(timer)
  }, [lastUnlocked, checkpoints])

  return (
    <>
      <ul className="badge-tray" aria-label="Trail badges">
        {checkpoints.map((checkpoint) => {
          const isUnlocked = unlocked.has(checkpoint.id)
          return (
            <li
              key={checkpoint.id}
              className={`badge-tray__badge${isUnlocked ? ' badge-tray__badge--unlocked' : ''}`}
              title={checkpoint.label}
            >
              <span className="badge-tray__icon" aria-hidden="true">
                {checkpoint.icon}
              </span>
            </li>
          )
        })}
      </ul>

      {toast && (
        <div className="badge-toast" role="status">
          <span className="badge-toast__icon" aria-hidden="true">
            {toast.icon}
          </span>
          <span>{toast.toast}</span>
        </div>
      )}
    </>
  )
}

export default BadgeTray
