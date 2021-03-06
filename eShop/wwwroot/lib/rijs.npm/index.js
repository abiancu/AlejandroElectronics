// -------------------------------------------
// Synchronises resources between server/client
// -------------------------------------------
module.exports = function(ripple, {} = {}){
  // TODO: prepopulate from browser
  log('creating')
  const from = async ({ data }) => {
    if (data.type != 'SUBSCRIBE') return req

    const module = data.value
        , npm = ripple('npm')

    if (!(module in npm.modules))
      update(`modules.${module}`, await bundle(module))(npm)
    
    // return stream(subset(`modules.${module}`, npm))
    return stream(subset(`modules.${module}`, npm))
      .map(() => ({
        exec: (o, { module, bundle }) => {
          const m = {}
          new Function("module", "exports", bundle)(m, {})
          o.next({ type: 'update', key: module, value: m.exports })
        }
      , value: { module, bundle: npm.modules[module] }
      }))
      .unpromise()
  }

  ripple('npm', { modules: {} }, { from })

  return ripple
}

const bundle = module => new Promise((resolve, reject) => browserify(bresolve(module), { standalone: module })
  .bundle((err, buf) => 
    err 
      ? reject(err)
      : resolve(buf.toString())
  )
)

const emitterify = require('utilise/emitterify')
const key = require('utilise/key')
const set = require('utilise/set')
const is = require('utilise/is')

const subset = (k, { destroy = true } = {}) => input => {
  if (!is.def(k)) return input
  const output = key(k, key(k)(input))(emitterify())

  input
    .on('change')
    .filter(({ key = '' }) => ~key.indexOf(k))
    .map(change => set(change)(output))
    .until(output.once('stop'))

  output
    .once('stop')
    .filter(d => destroy)
    .map(d => input.emit('stop'))
   
  return output
}

const stream = (input, { destroy = true, id  } = {}) => emitterify(input)
  .on('value')
  .on('start', function(){
    this.next({ type: 'update', value: input })

    input
      .on('change')
      .map(this.next)
      .until(this.once('stop'))

    this
      .once('stop')
      .filter(d => destroy)
      .map(d => input.emit('stop'))
  })


const log = require('utilise/log')('[ri/npm]')
    , err = require('utilise/err')('[ri/npm]')
    , deb = require('utilise/deb')('[ri/npm]')
    , file = require('utilise/file')
    , update = require('utilise/update')
    , browserify = require('browserify')
    , { browser = {} } = require('find-package-json')().next().value
    , { resolve } = require('path')
    , bresolve = module => require('browser-resolve')
        .sync(module, { filename: resolve('.', './foo') })