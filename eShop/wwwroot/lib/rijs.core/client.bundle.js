var core = (function () {
'use strict';

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};





function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var promise_1 = promise;

function promise() {
  var resolve
    , reject
    , p = new Promise(function(res, rej){ 
        resolve = res, reject = rej;
      });

  arguments.length && resolve(arguments[0]);
  p.resolve = resolve;
  p.reject  = reject;
  return p
}

var flatten = function flatten(p,v){ 
  if (v instanceof Array) { v = v.reduce(flatten, []); }
  return (p = p || []), p.concat(v) 
};

var has = function has(o, k) {
  return k in o
};

var def = function def(o, p, v, w){
  if (o.host && o.host.nodeName) { o = o.host; }
  if (p.name) { v = p, p = p.name; }
  !has(o, p) && Object.defineProperty(o, p, { value: v, writable: w });
  return o[p]
};

var emitterify = function emitterify(body) {
  body = body || {};
  def(body, 'emit', emit, 1);
  def(body, 'once', once, 1);
  def(body, 'off', off, 1);
  def(body, 'on', on, 1);
  body.on['*'] = body.on['*'] || [];
  return body

  function emit(type, pm, filter) {
    var li = body.on[type.split('.')[0]] || []
      , results = [];

    for (var i = 0; i < li.length; i++)
      { if (!li[i].ns || !filter || filter(li[i].ns))
        { results.push(call(li[i].isOnce ? li.splice(i--, 1)[0] : li[i], pm)); } }

    for (var i = 0; i < body.on['*'].length; i++)
      { results.push(call(body.on['*'][i], [type, pm])); }

    return results.reduce(flatten, [])
  }

  function call(cb, pm){
    return cb.next             ? cb.next(pm) 
         : pm instanceof Array ? cb.apply(body, pm) 
                               : cb.call(body, pm) 
  }

  function on(type, opts, isOnce) {
    var id = type.split('.')[0]
      , ns = type.split('.')[1]
      , li = body.on[id] = body.on[id] || []
      , cb = typeof opts == 'function' ? opts : 0;

    return !cb &&  ns ? (cb = body.on[id]['$'+ns]) ? cb : push(observable(body, opts))
         : !cb && !ns ? push(observable(body, opts))
         :  cb &&  ns ? push((remove(li, body.on[id]['$'+ns] || -1), cb))
         :  cb && !ns ? push(cb)
                      : false

    function push(cb){
      cb.isOnce = isOnce;
      cb.type = id;
      if (ns) { body.on[id]['$'+(cb.ns = ns)] = cb; }
      li.push(cb);
      return cb.next ? cb : body
    }
  }

  function once(type, callback){
    return body.on(type, callback, true)
  }

  function remove(li, cb) {
    var i = li.length;
    while (~--i) 
      { if (cb == li[i] || cb == li[i].fn || !cb)
        { li.splice(i, 1); } }
  }

  function off(type, cb) {
    remove((body.on[type] || []), cb);
    if (cb && cb.ns) { delete body.on[type]['$'+cb.ns]; }
    return body
  }

  function observable(parent, opts) {
    opts = opts || {};
    var o = emitterify(opts.base || promise_1());
    o.i = 0;
    o.li = [];
    o.fn = opts.fn;
    o.parent = parent;
    o.source = opts.fn ? o.parent.source : o;
    
    o.on('stop', function(reason){
      return o.type
        ? o.parent.off(o.type, o)
        : o.parent.off(o)
    });

    o.each = function(fn) {
      var n = fn.next ? fn : observable(o, { fn: fn });
      o.li.push(n);
      return n
    };

    o.pipe = function(fn) {
      return fn(o)
    };

    o.map = function(fn){
      return o.each(function(d, i, n){ return n.next(fn(d, i, n)) })
    };

    o.filter = function(fn){
      return o.each(function(d, i, n){ return fn(d, i, n) && n.next(d) })
    };

    o.reduce = function(fn, acc) {
      return o.each(function(d, i, n){ return n.next(acc = fn(acc, d, i, n)) })
    };

    o.unpromise = function(){ 
      var n = observable(o, { base: {}, fn: function(d){ return n.next(d) } });
      o.li.push(n);
      return n
    };

    o.next = function(value) {
      o.resolve && o.resolve(value);
      return o.li.length 
           ? o.li.map(function(n){ return n.fn(value, n.i++, n) })
           : value
    };

    o.until = function(stop){
      stop.each(function(){ o.source.emit('stop'); });
      return o
    };

    o.off = function(fn){
      return remove(o.li, fn), o
    };

    o[Symbol.asyncIterator] = function(){ return { 
      next: function () { return (o.wait = new Promise(function (resolve) {
        o.wait = true;
        o.map(function (d, i, n) {
          delete o.wait;
          o.off(n);
          resolve({ value: d, done: false });
        });

        o.emit('pull', o);
      })); }
    }};

    return o
  }
};

var client = typeof window != 'undefined';

var is_1 = is;
is.fn      = isFunction;
is.str     = isString;
is.num     = isNumber;
is.obj     = isObject;
is.lit     = isLiteral;
is.bol     = isBoolean;
is.truthy  = isTruthy;
is.falsy   = isFalsy;
is.arr     = isArray;
is.null    = isNull;
is.def     = isDef;
is.in      = isIn;
is.promise = isPromise;
is.stream  = isStream;

function is(v){
  return function(d){
    return d == v
  }
}

function isFunction(d) {
  return typeof d == 'function'
}

function isBoolean(d) {
  return typeof d == 'boolean'
}

function isString(d) {
  return typeof d == 'string'
}

function isNumber(d) {
  return typeof d == 'number'
}

function isObject(d) {
  return typeof d == 'object'
}

function isLiteral(d) {
  return typeof d == 'object' 
      && !(d instanceof Array)
}

function isTruthy(d) {
  return !!d == true
}

function isFalsy(d) {
  return !!d == false
}

function isArray(d) {
  return d instanceof Array
}

function isNull(d) {
  return d === null
}

function isDef(d) {
  return typeof d !== 'undefined'
}

function isPromise(d) {
  return d instanceof Promise
}

function isStream(d) {
  return !!(d && d.next)
}

function isIn(set) {
  return function(d){
    return !set ? false  
         : set.indexOf ? ~set.indexOf(d)
         : d in set
  }
}

var colorfill_1 = colorfill();

function colorfill(){
  /* istanbul ignore next */
  ['red', 'green', 'bold', 'grey', 'strip'].forEach(function(color) {
    !is_1.str(String.prototype[color]) && Object.defineProperty(String.prototype, color, {
      get: function() {
        return String(this)
      } 
    });
  });
}

var identity = function identity(d) {
  return d
};

var wrap = function wrap(d){
  return function(){
    return d
  }
};

var str = function str(d){
  return d === 0 ? '0'
       : !d ? ''
       : is_1.fn(d) ? '' + d
       : is_1.obj(d) ? JSON.stringify(d)
       : String(d)
};

var key = function key(k, v){ 
  var set = arguments.length > 1
    , keys = is_1.fn(k) ? [] : str(k).split('.')
    , root = keys.shift();

  return function deep(o, i){
    var masked = {};
    
    return !o ? undefined 
         : !is_1.num(k) && !k ? o
         : is_1.arr(k) ? (k.map(copy), masked)
         : o[k] || !keys.length ? (set ? ((o[k] = is_1.fn(v) ? v(o[k], i) : v), o)
                                       :  (is_1.fn(k) ? k(o) : o[k]))
                                : (set ? (key(keys.join('.'), v)(o[root] ? o[root] : (o[root] = {})), o)
                                       :  key(keys.join('.'))(o[root]))

    function copy(k){
      var val = key(k)(o);
      if (val != undefined) 
        { key(k, is_1.fn(val) ? wrap(val) : val)(masked); }
    }
  }
};

var header = function header(header$1, value) {
  var getter = arguments.length == 1;
  return function(d){ 
    return !d || !d.headers ? null
         : getter ? key(header$1)(d.headers)
                  : key(header$1)(d.headers) == value
  }
};

var keys = function keys(o) { 
  return Object.keys(is_1.obj(o) || is_1.fn(o) ? o : {})
};

var datum = function datum(node){
  return node.__data__
};

var from_1 = from;
from.parent = fromParent;

function from(o){
  return function(k){
    return key(k)(o)
  }
}

function fromParent(k){
  return datum(this.parentNode)[k]
}

var values = function values(o) {
  return !o ? [] : keys(o).map(from_1(o))
};

var to = { 
  arr: toArray
, obj: toObject
};

function toArray(d){
  return Array.prototype.slice.call(d, 0)
}

function toObject(d) {
  var by = 'id';

  return arguments.length == 1 
    ? (by = d, reduce)
    : reduce.apply(this, arguments)

  function reduce(p,v,i){
    if (i === 0) { p = {}; }
    p[is_1.fn(by) ? by(v, i) : v[by]] = v;
    return p
  }
}

var za = function za(k) {
  return function(a, b){
    var ka = key(k)(a) || ''
      , kb = key(k)(b) || '';

    return ka > kb ? -1 
         : ka < kb ?  1 
                   :  0
  }
};

var includes = function includes(pattern){
  return function(d){
    return d && d.indexOf && ~d.indexOf(pattern)
  }
};

var text = {
  header: 'text/plain'
, check: function check(res){ return !includes('.html')(res.name) && !includes('.css')(res.name) && is_1.str(res.body) }
};

var owner = client ? /* istanbul ignore next */ window : commonjsGlobal;

var err = function err(ns){
  return function(d){
    if (!owner.console || !console.error.apply) { return d; }
    is_1.arr(arguments[2]) && (arguments[2] = arguments[2].length);
    var args = to.arr(arguments)
      , prefix = '[err][' + (new Date()).toISOString() + ']' + ns;

    args.unshift(prefix.red ? prefix.red : prefix);
    return console.error.apply(console, args), d
  }
};

var log = function log(ns){
  return function(d){
    if (!owner.console || !console.log.apply) { return d; }
    is_1.arr(arguments[2]) && (arguments[2] = arguments[2].length);
    var args = to.arr(arguments)
      , prefix = '[log][' + (new Date()).toISOString() + ']' + ns;

    args.unshift(prefix.grey ? prefix.grey : prefix);
    return console.log.apply(console, args), d
  }
};

var core = createCommonjsModule(function (module) {
// -------------------------------------------
// API: Gets or sets a resource
// -------------------------------------------
// ripple('name')     - returns the resource body if it exists
// ripple('name')     - creates & returns resource if it doesn't exist
// ripple('name', {}) - creates & returns resource, with specified name and body
// ripple({ ... })    - creates & returns resource, with specified name, body and headers
// ripple.resources   - returns raw resources
// ripple.resource    - alias for ripple, returns ripple instead of resource for method chaining
// ripple.register    - alias for ripple
// ripple.on          - event listener for changes - all resources
// ripple('name').on  - event listener for changes - resource-specific

module.exports = function core(){
  log$$1('creating');

  var resources = {};
  ripple.resources = resources;
  ripple.resource  = chainable(ripple);
  ripple.register  = ripple;
  ripple.types     = types();
  return emitterify(ripple)

  function ripple(name, body, headers){
    return !name                                            ? ripple
         : is_1.arr(name)                                     ? name.map(ripple)
         : is_1.promise(name)                                 ? name.then(ripple).catch(err$$1)
         : is_1.obj(name) && !name.name                       ? ripple(values(name))
         : is_1.fn(name)  &&  name.resources                  ? ripple(values(name.resources))
         : is_1.str(name) && !body &&  ripple.resources[name] ? ripple.resources[name].body
         : is_1.str(name) && !body && !ripple.resources[name] ? undefined //register(ripple)({ name })
         : is_1.str(name) &&  body                            ? register(ripple)({ name: name, body: body, headers: headers })
         : is_1.obj(name) && !is_1.arr(name)                    ? register(ripple)(name)
         : (err$$1('could not find or create resource', name), false)
  }
};

var register = function (ripple) { return function (ref) {
  var name = ref.name;
  var body = ref.body;
  var headers = ref.headers; if ( headers === void 0 ) headers = {};

  log$$1('registering', name);
  if (is_1.promise(body)) { return body.then(function (body) { return register(ripple)({ name: name, body: body, headers: headers }); }).catch(err$$1) }
  var res = normalise(ripple)({ name: name, body: body, headers: headers });

  if (!res) { return err$$1('failed to register', name), false }
  ripple.resources[name] = res;
  ripple.emit('change', [name, { 
    type: 'update'
  , value: res.body
  , time: now(res)
  }]);
  return ripple.resources[name].body
}; };

var normalise = function (ripple) { return function (res) {
  if (!header('content-type')(res)) { values(ripple.types).sort(za('priority')).some(contentType(res)); }
  if (!header('content-type')(res)) { return err$$1('could not understand resource', res), false }
  return parse(ripple)(res)
}; };

var parse = function (ripple) { return function (res) {
  var type = header('content-type')(res);
  if (!ripple.types[type]) { return err$$1('could not understand type', type), false }
  return (ripple.types[type].parse || identity)(res)
}; };

var contentType = function (res) { return function (type) { return type.check(res) && (res.headers['content-type'] = type.header); }; };

var types = function () { return [text].reduce(to.obj('header'), 1); };

var chainable = function (fn) { return function() {
  return fn.apply(this, arguments), fn
}; };

var err$$1 = err('[ri/core]')
    , log$$1 = log('[ri/core]')
    , now = function (d, t) { return (t = key('body.log.length')(d), is_1.num(t) ? t - 1 : t); };
});

return core;

}());
