import { toPlainShape } from './board'

const byCreation = (a, b) => a.createdAt - b.createdAt || (a.id < b.id ? -1 : 1)

// Immutable snapshots of the shared map for useSyncExternalStore.
// Only shapes touched by a change are rebuilt, so untouched ones keep their identity.
export class ShapeStore {
  constructor(shapes) {
    this.shapes = shapes
    this.cache = new Map()
    this.listeners = new Set()

    shapes.forEach((shape, id) => this.cache.set(id, toPlainShape(id, shape)))
    this.snapshot = [...this.cache.values()].sort(byCreation)

    this.handleChange = (events) => {
      const changedIds = new Set()
      events.forEach((event) => {
        if (event.target === shapes) event.keysChanged.forEach((id) => changedIds.add(id))
        else changedIds.add(event.path[0])
      })
      changedIds.forEach((id) => {
        const shape = shapes.get(id)
        if (shape) this.cache.set(id, toPlainShape(id, shape))
        else this.cache.delete(id)
      })
      this.snapshot = [...this.cache.values()].sort(byCreation)
      this.listeners.forEach((listener) => listener())
    }
    shapes.observeDeep(this.handleChange)
  }

  subscribe = (listener) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = () => this.snapshot

  destroy() {
    this.shapes.unobserveDeep(this.handleChange)
    this.listeners.clear()
  }
}
