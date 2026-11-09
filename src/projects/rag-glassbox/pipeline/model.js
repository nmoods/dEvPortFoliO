// One source of truth for the embedding model: the build script and the browser worker MUST
// use the same model and precision, or the question and the chunks live in different vector spaces.
export const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2'
export const EMBEDDING_DTYPE = 'q8'
export const EMBEDDING_DIMS = 384
export const EMBEDDING_OPTIONS = { pooling: 'mean', normalize: true }
