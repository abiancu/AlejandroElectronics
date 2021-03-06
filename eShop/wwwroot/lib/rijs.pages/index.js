// -------------------------------------------
// Serves the /pages directory
// -------------------------------------------
module.exports = function pages(ripple, { server, dir } = {}){
  log('creating')
  const { http = server } = ripple.server || {}
  if (!http || !dir) return ripple
  expressify(http)
    .use(compression(), serve(resolve(dir, './pages'), { redirect: false }))
    .use('*', compression(), serve(resolve(dir, './pages')))
  return ripple
}

const expressify = server => server.express
  || key('_events.request')(server) 
  || server.on('request', express())._events.request

const compression = require('compression')
    , key = require('utilise/key')
    , { resolve } = require('path')
    , express = require('express')
    , serve = require('serve-static')
    , log = require('utilise/log')('[ri/pages]')