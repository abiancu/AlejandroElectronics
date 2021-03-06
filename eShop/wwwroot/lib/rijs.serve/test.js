var expect  = require('chai').expect
  , request = require('supertest')
  , app     = require('express')()
  , server  = require('http').createServer(app)
  , Server  = require('http').Server
  , serve   = require('./').default({}, { server })
  , createServer = require('http').createServer

describe('Serve Client', function() {
  
  it('should skip if no server given', function(){  
    expect(require('./').default({})).to.be.eql({})
    expect(require('./').default({}, {})).to.be.eql({})
    var plainServer = createServer()
    require('./').default({}, { server: plainServer })
    expect(plainServer._events.request).to.be.a('function')

    var app = require('express')()
      , expressServer = createServer(app)
    require('./').default({}, { server: expressServer })
    expect(expressServer._events.request).to.be.equal(app)
  })

  it('should serve client', function(done){  
    request(app)
      .get('/ripple.js')
      .expect('Content-Type', 'application/javascript')
      .expect(200, done)
  })

  it('should serve minified client', function(done){  
    request(app)
      .get('/ripple.min.js')
      .expect('Content-Type', 'application/javascript')
      .expect(200, done)
  })

  it('should serve standalone client', function(done){  
    request(app)
      .get('/ripple.pure.js')
      .expect('Content-Type', 'application/javascript')
      .expect(200, done)
  })

  it('should serve minified standalone client', function(done){  
    request(app)
      .get('/ripple.pure.min.js')
      .expect('Content-Type', 'application/javascript')
      .expect(200, done)
  })

  it('should serve from alternative base path', function(done){  
    var app    = require('express')()
      , server = require('http').createServer(app)
      , serve  = require('./').default({}, { server: server, serve: __dirname + '/src/test' })

    request(app)
      .get('/ripple.js')
      .expect("var ripple = 'hello world'")
      .expect('Content-Type', 'application/javascript')
      .expect(200, done)
  })

  it('should serve client with different name', function(done){  
    var app    = require('express')()
      , server = require('http').createServer(app)
      , serve  = require('./').default({}, { server: server, client: 'framework', serve: __dirname + '/src/test' })

    request(app)
      .get('/framework.js')
      .expect("var framework = 'hello world'")
      .expect('Content-Type', 'application/javascript')
      .expect(200, done)
  })

})