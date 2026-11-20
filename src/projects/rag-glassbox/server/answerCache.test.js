import { describe, expect, it } from 'vitest'
import { createAnswerCache } from './answerCache'

describe('answer cache', () => {
  it('matches the same question regardless of case and spacing, for the same chunks only', () => {
    const cache = createAnswerCache()
    cache.set({ question: 'How high is Le Pouce?', chunkIds: ['le-pouce#1'] }, 'About 812 m.')
    expect(cache.get({ question: '  how high is  le pouce? ', chunkIds: ['le-pouce#1'] })).toBe('About 812 m.')
    expect(cache.get({ question: 'How high is Le Pouce?', chunkIds: ['le-pouce#2'] })).toBeNull()
  })

  it('expires entries after the TTL', () => {
    let time = 0
    const cache = createAnswerCache({ ttlMs: 100, now: () => time })
    cache.set({ question: 'q', chunkIds: [] }, 'a')
    time = 101
    expect(cache.get({ question: 'q', chunkIds: [] })).toBeNull()
  })

  it('evicts the least recently used entry when full', () => {
    const cache = createAnswerCache({ maxEntries: 2 })
    cache.set({ question: 'a', chunkIds: [] }, 'A')
    cache.set({ question: 'b', chunkIds: [] }, 'B')
    cache.get({ question: 'a', chunkIds: [] })
    cache.set({ question: 'c', chunkIds: [] }, 'C')
    expect(cache.get({ question: 'b', chunkIds: [] })).toBeNull()
    expect(cache.get({ question: 'a', chunkIds: [] })).toBe('A')
    expect(cache.size).toBe(2)
  })
})
