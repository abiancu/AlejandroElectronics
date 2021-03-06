var expect = require('chai').expect
  , core = require('rijs.core')
  , css = require('./')

describe('CSS Type', function() {

  it('should create css resource', function(){  
    var ripple = css(core())
    ripple('foo.css', '.class { prop: value }')
    expect(ripple('foo.css')).to.eql('.class { prop: value }')
    expect(ripple.resources['foo.css'].headers).to.eql({ 'content-type': 'text/css', hash: 2195022255 })
  })

  it('should not create css resource', function(){  
    var ripple = css(core())
    ripple('baz', String)
    expect(ripple.resources.baz).to.not.be.ok
  })

})