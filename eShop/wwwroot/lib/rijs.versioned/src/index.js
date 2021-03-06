// -------------------------------------------
// Global Versioning and Time Travel
// -------------------------------------------
export default function version(ripple){
  log('creating')

  const type = ripple.types['application/data']
  ripple.on('change.version', commit(ripple))
  ripple.version = checkout(ripple)
  ripple.version.calc = calc(ripple)
  ripple.version.log = []
  return ripple
}

const commit = ripple => (name, change) => logged(ripple.resources[name]) && 
  ripple.version.log
    .push(values(ripple.resources)
      .filter(by(logged))
      .map(index))

const index = ({ name, body }) => ({ name, index: body.log.length - 1 })

const checkout = ripple => function(name, index) {
  return arguments.length == 2                 ? resource(ripple)({ name, index })
       : arguments.length == 1 && is.str(name) ? ripple.resources[name].body.log.length - 1
       : arguments.length == 1 && is.num(name) ? application(ripple)(name)
       : arguments.length == 0                 ? ripple.version.log.length - 1
       : err('could not rollback', name, index)
}

const application = ripple => index => ripple
  .version
  .log
  [rel(ripple.version.log, index)]
  .map(resource(ripple))

const resource = ripple => ({ name, index }) => ripple(name, ripple.version.calc(name, index))

const calc = ripple => (name, index) => {
  var log = ripple.resources[name].body.log
    , end = rel(log, index)
    , i   = end

  if (log[end].cache) return log[end].cache

  while (is.def(log[i].key)) i--
  const root = clone(log[i].value)
  while (i !== end) set(log[++i])(root)

  return def(log[end], 'cache', root)
}

const rel = (log, index) => index < 0 ? log.length + index - 1 : index

const logged = res => res.body.log && res.body.log.max > 0

const log = require('utilise/log')('[ri/versioned]')
    , err = require('utilise/err')('[ri/versioned]')
import values from 'utilise/values'
import clone from 'utilise/clone'
import set from 'utilise/set'
import key from 'utilise/key'
import def from 'utilise/def'
import by from 'utilise/by'
import is from 'utilise/is'