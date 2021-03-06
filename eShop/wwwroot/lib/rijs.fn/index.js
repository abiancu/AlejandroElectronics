// -------------------------------------------
// Adds support for function resources
// -------------------------------------------
module.exports = function fnc(ripple){
  log('creating')
  ripple.types['application/javascript'] = { 
    selector
  , extract
  , header
  , check
  , parse
  }
  return ripple
}

const selector = res => `${res.name},[is~="${res.name}"]`
    , extract = el => (attr('is')(el) || '').split(' ').concat(lo(el.nodeName))
    , header = 'application/javascript'
    , check = res => is.fn(res.body)
    , log   = require('utilise/log')('[ri/types/fn]')
    , parse = res => { 
        res.body = fn(res.body)
        key('headers.transpile.limit', 25)(res)
        return res
      }
  
const attr = require('utilise/attr')
    , key = require('utilise/key')
    , str = require('utilise/str')
    , is = require('utilise/is')
    , lo = require('utilise/lo')
    , fn = require('utilise/fn')