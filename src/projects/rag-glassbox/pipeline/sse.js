// Server-Sent Events over a POST response. EventSource only does GET, so the browser reads the
// body stream itself and this parser turns arbitrary network chunks back into whole events.

export const formatSse = (event, data) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`

export function createSseParser(onEvent) {
  let buffer = ''
  return (chunk) => {
    buffer += chunk.replaceAll('\r\n', '\n')
    let boundary = buffer.indexOf('\n\n')
    while (boundary !== -1) {
      const raw = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + 2)
      let event = 'message'
      const data = []
      for (const line of raw.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim()
        else if (line.startsWith('data:')) data.push(line.slice(5).trimStart())
      }
      if (data.length > 0) onEvent(event, JSON.parse(data.join('\n')))
      boundary = buffer.indexOf('\n\n')
    }
  }
}
