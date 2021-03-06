module.exports = function sync(
  ripple
, {} = {}
, { xrs = require('xrs/client') } = {}
){
  ripple.send = send(xrs())
  ripple.subscribe = subscribe(ripple)
  ripple.subscriptions = {}
  ripple.get = get(ripple)
  ripple.upload = upload(ripple)
  ripple.upload.id = 0
  ripple.render = render(ripple)(ripple.render)
  ripple.deps = deps(ripple)
  return ripple
}

const send = xrs => (name, type, value) =>
  name instanceof Blob ? xrs(name, type)
: is.obj(name)         ? xrs(name)
                       : xrs({ name, type, value })

const get = ripple => (name, k) => {
  ripple.subscriptions[name] = ripple.subscriptions[name] || {}
  if (is.arr(k)) return Promise.all(k.map(k => ripple.get(name, k)))
  const existing = key(k)(key(`resources.${name}.body`)(ripple))

  return k in ripple.subscriptions[name] && existing 
    ? Promise.resolve(existing)
    : ripple
        .subscribe(name, k)
        .filter((d, i, n) => n.source.emit('stop'))
        .map(d => key(k)(key(`resources.${name}.body`)(ripple)))
} 

const cache = (ripple, name, key) => change => {
  if (is.def(key)) change.key = `${key}.${str(change.key)}`
  !change.key && change.type == 'update'
    ? ripple(body(extend({ name })(change)))
    : set(change)(name in ripple.resources ? ripple(name) : ripple(name, {}))

  return change
}

// TODO: factor out
const merge = streams => {
  const output = emitterify().on('next')
      , latest = []

  streams.map(($, i) => 
    $.each(value => {
      latest[i] = value
      output.next(latest)
    })
  )

  output
    .once('stop')
    .map(d => streams.map($ => $.source.emit('stop')))

  return output
}

const subscribe = ripple => (name, k) => {
  if (is.arr(name)) return merge(name.map(n => ripple.subscribe(n, k)))
  ripple.subscriptions[name] = ripple.subscriptions[name] || {}
  if (is.arr(k)) return merge(k.map(k => ripple.subscribe(name, k))).map(d => key(k)(ripple(name))) // merge(ripple, name, k)
  const output = emitterify().on('next')

  output
    .on('stop')
    .filter(() => raw.off(output.next) && !raw.li.length)
    .map(() => raw.source.emit('stop'))
    .map(() => { ripple.subscriptions[name][k] = undefined })

  if (ripple.subscriptions[name][k])
    output
      .on('start')
      .map(() => key(k)(ripple(name)))
      .filter(is.def)
      .map(initial => output.next(initial))

  const raw = ripple.subscriptions[name][k] = ripple.subscriptions[name][k] || ripple
    .send(name, 'SUBSCRIBE', k)
    .map(cache(ripple, name, k))
    .map(d => key(k)(ripple(name)))
    // .reduce((acc = {}, d, i) => i ? set(d)(acc) : d.value)
    
  raw.each(output.next)
  
  return output
}

const upload = ripple => (name, form) => {
  let index = ++ripple.upload.id
    , fields = {}
    , size = 0
    , next = () => {
        if (!files.length) return true
        const { field, filename, i, blob } = files.shift()
        return ripple
          .send(blob, { filename, field, i, index })
          .on('progress', ({ received, total }) => output.emit('progress', {
            total: size
          , received: 
              size
            - (blob.size - received)
            - files.reduce((acc, d) => (acc += d.blob.size), 0)
          }))
          .then(next)
      }

  const files = keys(form)
    .map(field => (fields[field] = form[field], field))
    .filter(field => form[field] instanceof FileList)
    .map(field => { 
      fields[field] = []
      return to.arr(form[field])
        .map(f => (size += f.size, f))
        .map((f, i) => ({ field, filename: f.name, i, blob: f, sent: 0 }))
    })
    .reduce(flatten, [])

  const output = ripple.send({ 
    files: files.length
  , type: 'PREUPLOAD'
  , fields
  , index
  , size 
  , name
  }).once('sent', next)

  return output
}

const body = ({ name, value, headers }) => ({ name, headers, body: value })

const render = ripple => next => el => ripple.deps(el)
  .filter(not(is.in(ripple.subscriptions)))
  .map(dep => ripple
    .subscribe(dep)
    // TOOO: Should be .until(el.once('removed'))
    // .filter(d => !all(el.nodeName).length)
    // .map((d, i, n) => n.source.unsubscribe())
  )
  .length ? false : next(el)

const deps = ripple => el => values(ripple.types)
  .filter(d => d.extract)
  .map(d => d.extract(el))
  .reduce((p, v) => p.concat(v), [])
  .filter(Boolean)

const is = require('utilise/is')
    , to = require('utilise/to')
    , set = require('utilise/set')
    , not = require('utilise/not')
    , key = require('utilise/key')
    , str = require('utilise/str')
    , keys = require('utilise/keys')
    , flatten = require('utilise/flatten')
    , extend = require('utilise/extend')
    , values = require('utilise/values')
    , emitterify = require('utilise/emitterify')
    , all = node => arr(document.querySelectorAll(node))
    , { min, pow } = Math
    , nametype = (name, type) => `(${name ? name + ', ' : ''}${type ? type : ''})`
    , stream = chunks => new require('stream').Readable({
        read(){
          this.push(chunks.length ? new Buffer(new Uint8Array(chunks.shift())) : null)
        }
      })