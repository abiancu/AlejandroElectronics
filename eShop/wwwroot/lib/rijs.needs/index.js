// -------------------------------------------
// Define Default Attributes for Components
// -------------------------------------------
module.exports = function needs(ripple){
  if (!client) return;
  log('creating')
  ripple.render = render(ripple)(ripple.render)
  return ripple
}

const render = ripple => next => el => {
  const component = lo(el.nodeName)
  if (!(component in ripple.resources)) return
    
  const headers = ripple.resources[component].headers
      , attrs = headers.attrs = headers.attrs || parse(headers.needs, component)

  return attrs
    .map(([name, values]) => { 
      return values
        .map((v, i) => {
          const from = attr(el, name) || ''
          return includes(v)(from) ? false
               : attr(el, name, (from + ' ' + v).trim())
        }) 
        .some(Boolean)
    })
    .some(Boolean) ? el.draw() : next(el)
}

const parse = (attrs = '', component) => attrs
  .split('[')
  .slice(1)
  .map(replace(']', ''))
  .map(split('='))
  .map(([k, v]) => 
      v          ? [k, v.split(' ')]
    : k == 'css' ? [k, [component + '.css']]
                 : [k, []]
  )

const log = require('utilise/log')('[ri/needs]')
    , err = require('utilise/err')('[ri/needs]')
    , includes = require('utilise/includes')
    , replace = require('utilise/replace')
    , client = require('utilise/client')
    , split = require('utilise/split')
    , attr = require('utilise/attr')
    , key = require('utilise/key')
    , lo = require('utilise/lo')