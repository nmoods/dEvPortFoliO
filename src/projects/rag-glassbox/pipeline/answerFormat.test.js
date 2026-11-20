import { describe, expect, it } from 'vitest'
import { formatAnswer, inlineParts } from './answerFormat'

describe('inlineParts', () => {
  it('marks **bold** and keeps citations inside and outside it', () => {
    expect(inlineParts('**Lion Mountain [1]:** carry water [2].')).toEqual([
      { type: 'text', value: 'Lion Mountain ', bold: true },
      { type: 'cite', n: 1 },
      { type: 'text', value: ':', bold: true },
      { type: 'text', value: ' carry water ' },
      { type: 'cite', n: 2 },
      { type: 'text', value: '.' },
    ])
  })

  it('leaves an unfinished ** (mid-stream) as plain text', () => {
    expect(inlineParts('**Safety')).toEqual([{ type: 'text', value: '**Safety' }])
  })
})

describe('formatAnswer', () => {
  it('turns lines into paragraphs and groups consecutive bullets into one list', () => {
    const blocks = formatAnswer('Intro [1].\n\n**Safety notes:**\n*   Carry water [2].\n- Start early.\n1. Check rules.\nOutro.')
    expect(blocks.map((b) => b.type)).toEqual(['p', 'p', 'ul', 'p'])
    expect(blocks[2].items).toHaveLength(3)
    expect(blocks[2].items[0]).toEqual([{ type: 'text', value: 'Carry water ' }, { type: 'cite', n: 2 }, { type: 'text', value: '.' }])
  })

  it('never produces HTML from the text', () => {
    const [block] = formatAnswer('<img src=x onerror=alert(1)> [1]')
    expect(block.parts[0]).toEqual({ type: 'text', value: '<img src=x onerror=alert(1)> ' })
  })
})
