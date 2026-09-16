import { useEffect, useState } from 'react'

// sectionIds is expected to be a referentially stable array (defined once at module scope).
export function useTrailCheckpoints(sectionIds) {
  const [unlocked, setUnlocked] = useState(() => new Set())
  const [lastUnlocked, setLastUnlocked] = useState(null)

  useEffect(() => {
    const elements = sectionIds.map((id) => document.getElementById(id)).filter(Boolean)
    if (elements.length === 0) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const id = entry.target.id
          setUnlocked((prev) => {
            if (prev.has(id)) return prev
            const next = new Set(prev)
            next.add(id)
            return next
          })
          setLastUnlocked(id)
        })
      },
      { threshold: 0.4 }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [sectionIds])

  return { unlocked, lastUnlocked }
}
