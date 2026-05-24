const realEvents = typeof require !== 'undefined' ? require('events') : null

const _EventEmitter = realEvents?.EventEmitter || class EventEmitter {
  constructor() { this._events = {} }
  _addListener(type, listener, prepend) {
    if (!this._events) this._events = {}
    if (this._events[type]) {
      if (prepend) this._events[type].unshift(listener)
      else this._events[type].push(listener)
    } else this._events[type] = [listener]
  }
  addListener(type, listener) { this._addListener(type, listener, false); return this }
  on(type, listener) { this._addListener(type, listener, false); return this }
  prependListener(type, listener) { this._addListener(type, listener, true); return this }
  once(type, listener) {
    const wrapper = (...args) => { this.removeListener(type, wrapper); listener.apply(this, args) }
    wrapper.listener = listener
    this.on(type, wrapper)
    return this
  }
  removeListener(type, listener) {
    if (!this._events?.[type]) return this
    const idx = this._events[type].indexOf(listener)
    if (idx >= 0) this._events[type].splice(idx, 1)
    return this
  }
  off(type, listener) { return this.removeListener(type, listener) }
  removeAllListeners(type) {
    if (type) { if (this._events) delete this._events[type] }
    else this._events = {}
    return this
  }
  emit(type, ...args) {
    if (!this._events?.[type]) return false
    const handlers = [...this._events[type]]
    for (const handler of handlers) handler.apply(this, args)
    return true
  }
  eventNames() { return Object.keys(this._events || {}) }
  listeners(type) { return [...(this._events?.[type] || [])] }
  rawListeners(type) { return this.listeners(type) }
  listenerCount(type) { return this._events?.[type]?.length || 0 }
  getMaxListeners() { return this._maxListeners || 16 }
  setMaxListeners(n) { this._maxListeners = n; return this }
}

export const EventEmitter = _EventEmitter
export default { EventEmitter }
