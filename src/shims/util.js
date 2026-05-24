// Shim for Node.js 'util' module 鈥?used by gramjs and other dependencies
// In Electron renderer with nodeIntegration:true, the real 'util' is available via require
const realUtil = typeof require !== 'undefined' ? require('util') : null

export const inspect = realUtil?.inspect || {
  custom: Symbol.for('nodejs.util.inspect.custom'),
  defaultOptions: {},
  styles: {},
  colors: {},
}

export const debuglog = realUtil?.debuglog || function() { return function() {} }
export const format = realUtil?.format || function(fmt) {
  const args = Array.prototype.slice.call(arguments, 1)
  return fmt.replace(/%[sdj%]/g, function(m) {
    if (m === '%%') return '%'
    return String(args.shift())
  })
}
export const _extend = realUtil?._extend || function(target, source) {
  for (const key in source) target[key] = source[key]
  return target
}
export const inherits = realUtil?.inherits || function(ctor, superCtor) {
  if (superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: { value: ctor, writable: true, configurable: true }
    })
  }
}
export const deprecate = realUtil?.deprecate || function(fn) { return fn }
export const promisify = realUtil?.promisify || function(fn) {
  return function() {
    const args = Array.prototype.slice.call(arguments)
    return new Promise(function(resolve, reject) {
      args.push(function(err, result) {
        if (err) return reject(err)
        resolve(result)
      })
      fn.apply(this, args)
    })
  }
}
export const types = realUtil?.types || {}
export const callbackify = realUtil?.callbackify || function(fn) {
  return function() {
    const args = Array.prototype.slice.call(arguments)
    const cb = args.pop()
    fn.apply(this, args).then(function(result) { cb(null, result) }, function(err) { cb(err) })
  }
}
export const isArray = realUtil?.isArray || Array.isArray
export const isBoolean = realUtil?.isBoolean || function(v) { return typeof v === 'boolean' }
export const isNull = realUtil?.isNull || function(v) { return v === null }
export const isNullOrUndefined = realUtil?.isNullOrUndefined || function(v) { return v == null }
export const isNumber = realUtil?.isNumber || function(v) { return typeof v === 'number' }
export const isString = realUtil?.isString || function(v) { return typeof v === 'string' }
export const isSymbol = realUtil?.isSymbol || function(v) { return typeof v === 'symbol' }
export const isUndefined = realUtil?.isUndefined || function(v) { return v === undefined }
export const isObject = realUtil?.isObject || function(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}
export const isFunction = realUtil?.isFunction || function(v) { return typeof v === 'function' }
export const isPrimitive = realUtil?.isPrimitive || function(v) {
  return v === null || (typeof v !== 'object' && typeof v !== 'function')
}
export const isBuffer = realUtil?.isBuffer || function() { return false }
export const isDate = realUtil?.isDate || function(v) { return v instanceof Date }
export const isError = realUtil?.isError || function(v) { return v instanceof Error }
export const isRegExp = realUtil?.isRegExp || function(v) { return v instanceof RegExp }

export default {
  inspect, debuglog, format, _extend, inherits,
  deprecate, promisify, types, callbackify,
  isArray, isBoolean, isNull, isNullOrUndefined,
  isNumber, isString, isSymbol, isUndefined,
  isObject, isFunction, isPrimitive, isBuffer,
  isDate, isError, isRegExp,
}