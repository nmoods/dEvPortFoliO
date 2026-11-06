import { describe, expect, it } from 'vitest'
import { diffText, transformIndex } from './textDiff'

describe('diffText', () => {
  it.each([
    ['', 'abc', { index: 0, deleteCount: 0, insert: 'abc' }],
    ['abc', 'abXc', { index: 2, deleteCount: 0, insert: 'X' }],
    ['abcdef', 'abef', { index: 2, deleteCount: 2, insert: '' }],
    ['hello world', 'hello there world', { index: 6, deleteCount: 0, insert: 'there ' }],
    ['aaa', 'aaaa', { index: 3, deleteCount: 0, insert: 'a' }],
    ['same', 'same', { index: 4, deleteCount: 0, insert: '' }],
  ])('diffs %j -> %j', (previous, next, expected) => {
    expect(diffText(previous, next)).toEqual(expected)
  })
})

describe('transformIndex', () => {
  const splice = { index: 2, deleteCount: 2, insert: 'XYZ' }

  it('keeps carets before the splice', () => expect(transformIndex(1, splice)).toBe(1))
  it('shifts carets after the splice', () => expect(transformIndex(6, splice)).toBe(7))
  it('moves carets inside a deleted range to the end of the insertion', () =>
    expect(transformIndex(3, splice)).toBe(5))
})
