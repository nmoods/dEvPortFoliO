// PCA by power iteration: find the 2 directions along which the chunk vectors vary the most,
// so 384-dimensional embeddings can be drawn on a 2D map. Fitted once at build time;
// the browser only calls `project` to place the question on the same map.

const dot = (a, b) => {
  let sum = 0
  for (let i = 0; i < a.length; i += 1) sum += a[i] * b[i]
  return sum
}

function normalize(v) {
  const length = Math.sqrt(dot(v, v)) || 1
  for (let i = 0; i < v.length; i += 1) v[i] /= length
  return v
}

/** @param matrix flat Float32Array of `count` rows × `dims` columns */
export function fitPCA(matrix, dims, { components = 2, iterations = 200 } = {}) {
  const count = matrix.length / dims
  const mean = new Float64Array(dims)
  for (let r = 0; r < count; r += 1) for (let d = 0; d < dims; d += 1) mean[d] += matrix[r * dims + d] / count

  const centered = Array.from({ length: count }, (_, r) => {
    const v = new Float64Array(dims)
    for (let d = 0; d < dims; d += 1) v[d] = matrix[r * dims + d] - mean[d]
    return v
  })

  const found = []
  for (let c = 0; c < components; c += 1) {
    // Deterministic start so rebuilding the index gives the same map.
    let v = normalize(Float64Array.from({ length: dims }, (_, d) => Math.sin(d * (c + 1) + 1)))
    for (let it = 0; it < iterations; it += 1) {
      const next = new Float64Array(dims)
      for (const x of centered) {
        const weight = dot(x, v)
        for (let d = 0; d < dims; d += 1) next[d] += weight * x[d]
      }
      // Stay orthogonal to the components already found (deflation).
      for (const previous of found) {
        const overlap = dot(next, previous)
        for (let d = 0; d < dims; d += 1) next[d] -= overlap * previous[d]
      }
      v = normalize(next)
    }
    found.push(v)
  }

  return { mean: Array.from(mean), components: found.map((v) => Array.from(v)) }
}

export function project(vector, { mean, components }) {
  return components.map((component) => {
    let sum = 0
    for (let d = 0; d < mean.length; d += 1) sum += (vector[d] - mean[d]) * component[d]
    return sum
  })
}
