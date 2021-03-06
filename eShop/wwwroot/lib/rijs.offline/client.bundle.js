var offline = (function () {
'use strict';

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

var debounce = function debounce(d){
  var pending, wait = is_1.num(d) ? d : 100;

  return is_1.fn(d) 
       ? next(d)
       : next

  function next(fn){
    return function(){
      var ctx = this, args = arguments;
      pending && clearTimeout(pending);
      pending = setTimeout(function(){ fn.apply(ctx, args); }, wait);
    }
  }
  
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

var client = typeof window != 'undefined';

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

var parse = function parse(d){
  return d && JSON.parse(d)
};

var clone = function clone(d) {
  return !is_1.fn(d) && !is_1.str(d)
       ? parse(str(d))
       : d
};

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

var owner = client ? /* istanbul ignore next */ window : commonjsGlobal;

var noop = function noop(){};

var group = function group(prefix, fn){
  if (!owner.console) { return fn() }
  if (!console.groupCollapsed) { polyfill(); }
  console.groupCollapsed(prefix);
  var ret = fn();
  console.groupEnd(prefix);
  return ret
};

function polyfill() {
  console.groupCollapsed = console.groupEnd = function(d){
    (console.log || noop)('*****', d, '*****');
  };
}

var not = function not(fn){
  return function(){
    return !fn.apply(this, arguments)
  }
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

var log$1 = function log(ns){
  return function(d){
    if (!owner.console || !console.log.apply) { return d; }
    is_1.arr(arguments[2]) && (arguments[2] = arguments[2].length);
    var args = to.arr(arguments)
      , prefix = '[log][' + (new Date()).toISOString() + ']' + ns;

    args.unshift(prefix.grey ? prefix.grey : prefix);
    return console.log.apply(console, args), d
  }
};

// -------------------------------------------
// API: Cache to and Restore from localStorage
// -------------------------------------------
var offline = function offline(ripple){
  if (!client || !window.localStorage) { return; }
  log('creating');
  load(ripple);
  ripple.on('change.cache', debounce(1000)(cache(ripple)));
  return ripple
};

var load = function (ripple) { return group('loading cache', function (d) { return (parse(localStorage.ripple) || [])
    .map(ripple); }); };

var cache = function (ripple) { return function (res) {
  log('cached');
  var cachable = values(clone(ripple.resources))
    .filter(not(header('cache', 'no-store')));

  cachable
    .filter(header('content-type', 'application/javascript'))
    .map(function (d) { return d.body = str(ripple.resources[d.name].body); } );

  localStorage.ripple = str(cachable);
}; };

var log = log$1('[ri/offline]');

return offline;

}());
