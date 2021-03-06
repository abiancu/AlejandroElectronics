var xrs = (function () {
'use strict';

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
  if (v instanceof Array) v = v.reduce(flatten, []);
  return (p = p || []), p.concat(v) 
};

var has = function has(o, k) {
  return k in o
};

var def = function def(o, p, v, w){
  if (o.host && o.host.nodeName) o = o.host;
  if (p.name) v = p, p = p.name;
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
      if (!li[i].ns || !filter || filter(li[i].ns))
        results.push(call(li[i].isOnce ? li.splice(i--, 1)[0] : li[i], pm));

    for (var i = 0; i < body.on['*'].length; i++)
      results.push(call(body.on['*'][i], [type, pm]));

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
      if (ns) body.on[id]['$'+(cb.ns = ns)] = cb;
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
      if (cb == li[i] || cb == li[i].fn || !cb)
        li.splice(i, 1);
  }

  function off(type, cb) {
    remove((body.on[type] || []), cb);
    if (cb && cb.ns) delete body.on[type]['$'+cb.ns];
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
      next: () => (o.wait = new Promise(resolve => {
        o.wait = true;
        o.map((d, i, n) => {
          delete o.wait;
          o.off(n);
          resolve({ value: d, done: false });
        });

        o.emit('pull', o);
      }))
    }};

    return o
  }
};

var nanosocket = function(url = location.href.replace('http', 'ws')){
  const io = emitterify({ attempt: 0 });
  io.ready = io.once('connected');
  io.connect = connect(io, url);
  io.connect(); 
  io.send = data => io.ready.then(socket => socket.send(data));
  return io
};

const { min, pow } = Math;

const connect = (io, url) => () => {
  const { WebSocket, location, setTimeout } = window
      , socket = new WebSocket(url);
  socket.onopen = d => io.emit('connected', socket);
  socket.onmessage = d => io.emit('recv', d.data);
  socket.onclose = d => { 
    io.ready = io.once('connected');
    io.emit('disconnected');
    setTimeout(io.connect, backoff(++io.attempt));
  };
};

const backoff = (attempt, base = 100, cap = 10000) =>
  min(cap, base * pow(2, attempt));

var promise_1$2 = promise$2;

function promise$2() {
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

var flatten$3 = function flatten(p,v){ 
  if (v instanceof Array) v = v.reduce(flatten, []);
  return (p = p || []), p.concat(v) 
};

var has$3 = function has(o, k) {
  return k in o
};

var def$3 = function def(o, p, v, w){
  if (o.host && o.host.nodeName) o = o.host;
  if (p.name) v = p, p = p.name;
  !has$3(o, p) && Object.defineProperty(o, p, { value: v, writable: w });
  return o[p]
};

var emitterify$3 = function emitterify(body) {
  body = body || {};
  def$3(body, 'emit', emit, 1);
  def$3(body, 'once', once, 1);
  def$3(body, 'off', off, 1);
  def$3(body, 'on', on, 1);
  body.on['*'] = body.on['*'] || [];
  return body

  function emit(type, pm, filter) {
    var li = body.on[type.split('.')[0]] || []
      , results = [];

    for (var i = 0; i < li.length; i++)
      if (!li[i].ns || !filter || filter(li[i].ns))
        results.push(call(li[i].isOnce ? li.splice(i--, 1)[0] : li[i], pm));

    for (var i = 0; i < body.on['*'].length; i++)
      results.push(call(body.on['*'][i], [type, pm]));

    return results.reduce(flatten$3, [])
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
      if (ns) body.on[id]['$'+(cb.ns = ns)] = cb;
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
      if (cb == li[i] || cb == li[i].fn || !cb)
        li.splice(i, 1);
  }

  function off(type, cb) {
    remove((body.on[type] || []), cb);
    if (cb && cb.ns) delete body.on[type]['$'+cb.ns];
    return body
  }

  function observable(parent, opts) {
    opts = opts || {};
    var o = emitterify(opts.base || promise_1$2());
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
      next: () => (o.wait = new Promise(resolve => {
        o.wait = true;
        o.map((d, i, n) => {
          delete o.wait;
          o.off(n);
          resolve({ value: d, done: false });
        });

        o.emit('pull', o);
      }))
    }};

    return o
  }
};

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

var keys = function keys(o) { 
  return Object.keys(is_1.obj(o) || is_1.fn(o) ? o : {})
};

var datum = function datum(node){
  return node.__data__
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
        key(k, is_1.fn(val) ? wrap(val) : val)(masked);
    }
  }
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

var cryo = createCommonjsModule(function (module) {
/**
 * JSON + Object references wrapper
 *
 * @author Hunter Loftis <hunter@skookum.com>
 * @license The MIT license.
 * @copyright Copyright (c) 2010 Skookum, skookum.com
 */

(function() {

  var CONTAINER_TYPES = 'object array date function'.split(' ');

  var REFERENCE_FLAG = '_CRYO_REF_';
  var INFINITY_FLAG = '_CRYO_INFINITY_';
  var FUNCTION_FLAG = '_CRYO_FUNCTION_';
  var UNDEFINED_FLAG = '_CRYO_UNDEFINED_';
  var DATE_FLAG = '_CRYO_DATE_';

  var OBJECT_FLAG = '_CRYO_OBJECT_';
  var ARRAY_FLAG = '_CRYO_ARRAY_';

  function typeOf(item) {
    if (typeof item === 'object') {
      if (item === null) return 'null';
      if (item && item.nodeType === 1) return 'dom';
      if (item instanceof Array) return 'array';
      if (item instanceof Date) return 'date';
      return 'object';
    }
    return typeof item;
  }

  // Same as and copied from _.defaults
  function defaults(obj) {
    var length = arguments.length;
    if (length < 2 || obj == null) return obj;
    for (var index = 1; index < length; index++) {
      var source = arguments[index],
          keys = Object.keys(source),
          l = keys.length;
      for (var i = 0; i < l; i++) {
        var key = keys[i];
        if (obj[key] === void 0) obj[key] = source[key];
      }
    }
    return obj;
  }

  function stringify(item, options) {
    var references = [];

    // Backward compatibility with 0.0.6 that exepects `options` to be a callback.
    options = typeof options === 'function' ? { prepare: options } : options;
    options = defaults(options || {}, {
      prepare: null,
      isSerializable: function(item, key) {
        return item.hasOwnProperty(key);
      }
    });

    var root = cloneWithReferences(item, references, options);

    return JSON.stringify({
      root: root,
      references: references
    });
  }

  function cloneWithReferences(item, references, options, savedItems) {
    // invoke callback before any operations related to serializing the item
    if (options.prepare) { options.prepare(item); }

    savedItems = savedItems || [];
    var type = typeOf(item);

    // can this object contain its own properties?
    if (CONTAINER_TYPES.indexOf(type) !== -1) {
      var referenceIndex = savedItems.indexOf(item);
      // do we need to store a new reference to this object?
      if (referenceIndex === -1) {
        var clone = {};
        referenceIndex = references.push({
          contents: clone,
          value: wrapConstructor(item)
        }) - 1;
        savedItems[referenceIndex] = item;
        for (var key in item) {
          if (options.isSerializable(item, key)) {
            clone[key] = cloneWithReferences(item[key], references, options, savedItems);
          }
        }
      }

      // return something like _CRYO_REF_22
      return REFERENCE_FLAG + referenceIndex;
    }

    // return a non-container object
    return wrap(item);
  }

  function parse(string, options) {
    var json = JSON.parse(string);

    // Backward compatibility with 0.0.6 that exepects `options` to be a callback.
    options = typeof options === 'function' ? { finalize: options } : options;
    options = defaults(options || {}, { finalize: null });

    return rebuildFromReferences(json.root, json.references, options);
  }

  function rebuildFromReferences(item, references, options, restoredItems) {
    restoredItems = restoredItems || [];
    if (starts(item, REFERENCE_FLAG)) {
      var referenceIndex = parseInt(item.slice(REFERENCE_FLAG.length), 10);
      if (!restoredItems.hasOwnProperty(referenceIndex)) {
        var ref = references[referenceIndex];
        var container = unwrapConstructor(ref.value);
        var contents = ref.contents;
        restoredItems[referenceIndex] = container;
        for (var key in contents) {
          container[key] = rebuildFromReferences(contents[key], references, options, restoredItems);
        }
      }

      // invoke callback after all operations related to serializing the item
      if (options.finalize) { options.finalize(restoredItems[referenceIndex]); }

      return restoredItems[referenceIndex];
    }

    // invoke callback after all operations related to serializing the item
    if (options.finalize) { options.finalize(item); }

    return unwrap(item);
  }

  function wrap(item) {
    var type = typeOf(item);
    if (type === 'undefined') return UNDEFINED_FLAG;
    if (type === 'function') return FUNCTION_FLAG + item.toString();
    if (type === 'date') return DATE_FLAG + item.getTime();
    if (item === Infinity) return INFINITY_FLAG;
    if (type === 'dom') return undefined;
    return item;
  }

  function wrapConstructor(item) {
    var type = typeOf(item);
    if (type === 'function' || type === 'date') return wrap(item);
    if (type === 'object') return OBJECT_FLAG;
    if (type === 'array') return ARRAY_FLAG;
    return item;
  }

  function unwrapConstructor(val) {
    if (typeOf(val) === 'string') {
      if (val === UNDEFINED_FLAG) return undefined;
      if (starts(val, FUNCTION_FLAG)) {
        return (new Function("return " + val.slice(FUNCTION_FLAG.length)))();
      }
      if (starts(val, DATE_FLAG)) {
        var dateNum = parseInt(val.slice(DATE_FLAG.length), 10);
        return new Date(dateNum);
      }
      if (starts(val, OBJECT_FLAG)) {
        return {};
      }
      if (starts(val, ARRAY_FLAG)) {
        return [];
      }
      if (val === INFINITY_FLAG) return Infinity;
    }
    return val;
  }

  function unwrap(val) {
    if (typeOf(val) === 'string') {
      if (val === UNDEFINED_FLAG) return undefined;
      if (starts(val, FUNCTION_FLAG)) {
        var fn = val.slice(FUNCTION_FLAG.length);
        var argStart = fn.indexOf('(') + 1;
        var argEnd = fn.indexOf(')', argStart);
        var args = fn.slice(argStart, argEnd);
        var bodyStart = fn.indexOf('{') + 1;
        var bodyEnd = fn.lastIndexOf('}') - 1;
        var body = fn.slice(bodyStart, bodyEnd);
        return new Function(args, body);
      }
      if (starts(val, DATE_FLAG)) {
        var dateNum = parseInt(val.slice(DATE_FLAG.length), 10);
        return new Date(dateNum);
      }
      if (val === INFINITY_FLAG) return Infinity;
    }
    return val;
  }

  function starts(string, prefix) {
    return typeOf(string) === 'string' && string.slice(0, prefix.length) === prefix;
  }

  var Cryo = {
    stringify: stringify,
    parse: parse
  };

  // global on server, window in browser
  var root = this;

  // AMD / RequireJS
  if (typeof undefined !== 'undefined' && undefined.amd) {
    undefined('Cryo', [], function () {
      return Cryo;
    });
  }

  // node.js
  else if ('object' !== 'undefined' && module.exports) {
    module.exports = Cryo;
  }

  // included directly via <script> tag
  else {
    root.Cryo = Cryo;
  }

})();
});

var client = createCommonjsModule(function (module) {
module.exports = function({ 
  socket = nanosocket()
} = {}){
  socket.id = 0;
  
  socket
    .once('disconnected')
    .map(d => socket
      .on('connected')
      .map(reconnect(socket))
    );

  socket
    .on('recv')
    .map(d => parse(d))
    .each(({ id, data }) => data.exec
      ? data.exec(socket.on[`$${id}`] && socket.on[`$${id}`][0], data.value)
      : socket.emit(`$${id}`, data)
    );

  return Object.defineProperty(send(socket)
    , 'subscriptions'
    , { get: d => subscriptions(socket) }
    )
};

const subscriptions = socket => values(socket.on)
  .map(d => d && d[0])
  .filter(d => d && d.type && d.type[0] == '$');

const reconnect = socket => () => subscriptions(socket)
  .map(d => d.type)
  .map(d => socket.send(socket.on[d][0].subscription));

const { parse } = cryo;

const send = (socket, type) => (data, meta) => {
  if (data instanceof window.Blob) 
    return binary(socket, data, meta)

  const id = str(++socket.id)
      , output = socket.on(`$${id}`)
      , next = (data, count = 0) => socket
          .send(output.source.subscription = str({ id, data, type }))
          .then(d => output.emit('sent', { id, count }));

  data.next 
    ? data.map(next).source.emit('start')
    : next(data);

  output
    .source
    .once('stop')
    .filter(reason => reason != 'CLOSED')
    .map(d => send(socket, 'UNSUBSCRIBE')(id)
      .filter((d, i, n) => n.source.emit('stop', 'CLOSED'))
    );

  return output
};

const binary = (socket, blob, meta, start = 0, blockSize = 1024) => {
  const output = emitterify$3().on('recv')
      , next = id => () =>  
          start >= blob.size 
            ? output.emit('sent', { id })
            : ( socket.send(blob.slice(start, start += blockSize))
              , window.setTimeout(next(id))
              );

  send(socket, 'BINARY')({ size: blob.size, meta })
    .on('sent', ({ id }) => next(id)())
    .on('progress', received => output.emit('progress', { received, total: blob.size }))
    .map(output.next)
    .source
    .until(output.once('stop'));

  return output
};
});

return client;

}());
