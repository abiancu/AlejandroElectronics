var expect  = require('chai').expect
  , request = require('supertest')
  , app     = require('express')()
  , server  = require('http').createServer(app)
  , pages   = require('./')({}, { server, dir: __dirname })

describe('Serve Pages', function() {
  
  it('should pass over serverless node', function(){  
    expect(require('./')({})).to.be.eql({})
  })

  it('should gracefully proceed if no server/dir', function(){  
    expect(require('./')({}, {})).to.be.eql({})
  })

  it('should serve pages - hit', function(done){  
    request(app)
      .get('/index.html')
      .expect('<h1>Hello World</h1>')
      .expect(200, done)
  })

  it('should serve pages - miss file', function(done){  
    request(app)
      .get('/missing-path')
      .expect('Location', '/missing-path/')
      .expect(301, done)
  })

  it('should serve pages - miss path', function(done){  
    request(app)
      .get('/missing-path/')
      .expect('<h1>Hello World</h1>')
      .expect(200, done)
  })

  it('should default to index', function(done){  
    request(app)
      .get('/')
      .expect('<h1>Hello World</h1>')
      .expect(200, done)
  })

  it('should serve other assets', function(done){  
    request(app)
      .get('/foo.txt')
      .expect('foo')
      .expect(200, done)
  })

})