// Reading an OpenAI-compatible streaming response (Groq, Gemini, Ollama all speak it).

/** Turns network chunks into parsed `data:` payloads; stops at `data: [DONE]`. */
export async function* readChatStream(body) {
  const decoder = new TextDecoder()
  let buffer = ''
  for await (const chunk of body) {
    buffer += decoder.decode(chunk, { stream: true }).replaceAll('\r\n', '\n')
    let newline = buffer.indexOf('\n')
    while (newline !== -1) {
      const line = buffer.slice(0, newline).trim()
      buffer = buffer.slice(newline + 1)
      if (line.startsWith('data:')) {
        const data = line.slice(5).trim()
        if (data === '[DONE]') return
        if (data) yield JSON.parse(data)
      }
      newline = buffer.indexOf('\n')
    }
  }
}

/**
 * Some open models (Qwen, DeepSeek) write their reasoning inline as <think>…</think>.
 * This removes it from a stream of text pieces, even when a tag is split across pieces.
 */
export function createThinkFilter() {
  let inside = false
  let pending = ''
  const OPEN = '<think>'
  const CLOSE = '</think>'

  return (piece) => {
    pending += piece
    let output = ''
    for (;;) {
      const tag = inside ? CLOSE : OPEN
      const at = pending.indexOf(tag)
      if (at !== -1) {
        if (!inside) output += pending.slice(0, at)
        pending = pending.slice(at + tag.length)
        inside = !inside
        continue
      }
      // Keep a possible partial tag ("<thi") for the next piece; release the rest.
      let keep = 0
      for (let n = Math.min(tag.length - 1, pending.length); n > 0; n -= 1) {
        if (tag.startsWith(pending.slice(-n))) {
          keep = n
          break
        }
      }
      if (!inside) output += pending.slice(0, pending.length - keep)
      pending = pending.slice(pending.length - keep)
      return output
    }
  }
}
