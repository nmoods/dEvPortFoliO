import { useEffect, useState } from 'react'

const STORAGE_KEY = 'trail-mood'
export const MOODS = ['overcast', 'golden', 'dusk']

function getInitialMood() {
  if (typeof window === 'undefined') return 'overcast'

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (MOODS.includes(stored)) return stored

  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dusk' : 'overcast'
}

export function useTrailMood() {
  const [mood, setMood] = useState(getInitialMood)

  useEffect(() => {
    document.documentElement.dataset.mood = mood
    window.localStorage.setItem(STORAGE_KEY, mood)
  }, [mood])

  return [mood, setMood]
}
