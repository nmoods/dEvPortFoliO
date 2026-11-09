// Vectors travel as base64 Float32 (little-endian): ~4x smaller than JSON number arrays.

export function toBase64(floats) {
  const bytes = new Uint8Array(floats.buffer, floats.byteOffset, floats.byteLength)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

export function fromBase64(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new Float32Array(bytes.buffer)
}

/** Row `index` of a flat matrix, without copying. */
export const row = (matrix, dims, index) => matrix.subarray(index * dims, (index + 1) * dims)
