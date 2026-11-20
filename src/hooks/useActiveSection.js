import { useEffect, useState } from 'react'

/** Id of the section crossing the middle of the viewport. `ids` must be a stable (module-level) array. */
export function useActiveSection(ids) {
  const [active, setActive] = useState(null)

  useEffect(() => {
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean)
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px' }
    )
    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [ids])

  return active
}
