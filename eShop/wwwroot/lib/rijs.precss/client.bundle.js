var precss = (function () {
'use strict';

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};





function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

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

var client = typeof window != 'undefined';

var owner = client ? /* istanbul ignore next */ window : commonjsGlobal;

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

var attr = function attr(name, value) {
  var args = arguments.length;
  
  return !is_1.str(name) && args == 2 ? attr(arguments[1]).call(this, arguments[0])
       : !is_1.str(name) && args == 3 ? attr(arguments[1], arguments[2]).call(this, arguments[0])
       :  function(el){
            var ctx = this || {};
            el = ctx.nodeName || is_1.fn(ctx.node) ? ctx : el;
            el = el.node ? el.node() : el;
            el = el.host || el;

            return args > 1 && value === false ? el.removeAttribute(name)
                 : args > 1                    ? (el.setAttribute(name, value), value)
                 : el.attributes.getNamedItem(name) 
                && el.attributes.getNamedItem(name).value
          } 
};

var raw = function raw(selector, doc){
  var prefix = !doc && document.head.createShadowRoot ? 'html /deep/ ' : '';
  return (doc ? doc : document).querySelector(prefix+selector)
};

var str = function str(d){
  return d === 0 ? '0'
       : !d ? ''
       : is_1.fn(d) ? '' + d
       : is_1.obj(d) ? JSON.stringify(d)
       : String(d)
};

var not = function not(fn){
  return function(){
    return !fn.apply(this, arguments)
  }
};

var wrap = function wrap(d){
  return function(){
    return d
  }
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

var by = function by(k, v){
  var exists = arguments.length == 1;
  return function(o){
    var d = is_1.fn(k) ? k(o) : key(k)(o);
    
    return d && v && d.toLowerCase && v.toLowerCase ? d.toLowerCase() === v.toLowerCase()
         : exists ? Boolean(d)
         : is_1.fn(v) ? v(d)
         : d == v
  }
};

var prepend = function prepend(v) {
  return function(d){
    return v+d
  }
};

var el = function el(selector){
  var attrs = []
    , css = selector.replace(/\[(.+?)=(.*?)\]/g, function($1, $2, $3){ attrs.push([$2, $3]); return '' }).split('.')
    , tag  = css.shift()
    , elem = document.createElement(tag);

  attrs.forEach(function(d){ attr(elem, d[0], d[1]); });
  css.forEach(function(d){ elem.classList.add(d);});
  elem.toString = function(){ return tag + css.map(prepend('.')).join('') };

  return elem
};

var cssscope = function scope(styles, prefix) {
  return styles
    .replace(/^(?!.*:host)([^@%\n]*){/gim, function($1){ return prefix+' '+$1 })       // ... {                 -> tag ... {
    .replace(/^(?!.*:host)(.*?),\s*$/gim, function($1){ return prefix+' '+$1 })        // ... ,                 -> tag ... ,
    .replace(/:host\((.*?)\)/gi, function($1, $2){ return prefix+$2 })                 // :host(...)            -> tag...
    .replace(/:host([ ,])/gi, function($1, $2){ return prefix+$2 })                                                 // :host ...             -> tag ...
    .replace(/^.*:host-context\((.*)\)/gim, function($1, $2){ return $2+' ' +prefix }) // ... :host-context(..) -> ... tag..
};

var precss = createCommonjsModule(function (module) {
// -------------------------------------------
// Pre-applies Scoped CSS [css=name]
// -------------------------------------------
module.exports = function precss(ripple){
  if (!client) { return; }
  log$$1('creating');  
  ripple.render = render(ripple)(ripple.render);
  return ripple
};

var render = function (ripple) { return function (next) { return function (host) {
  var css = str(attr(host, 'css')).split(' ').filter(Boolean)
    , root = host.shadowRoot || host
    , head = document.head
    , shadow = head.createShadowRoot && host.shadowRoot;

  // this host does not have a css dep, continue with rest of rendering pipeline
  if (!css.length) { return next(host) }
  
  // this host has a css dep, but it is not loaded yet - stop rendering this host
  if (css.some(not(is_1.in(ripple.resources)))) { return; }

  css
    // reuse or create style tag
    .map(function (d) { return ({ 
      res: ripple.resources[d] 
    , el: raw(("style[resource=\"" + d + "\"]"), shadow ? root : head) || el(("style[resource=" + d + "]")) 
    }); })
    // check if hash of styles changed
    .filter(function (d, i) { return d.el.hash != d.res.headers.hash; })
    .map(function (d, i) {
      d.el.hash = d.res.headers.hash;
      d.el.innerHTML = shadow ? d.res.body : transform(d.res.body, d.res.name);
      return d.el
    })
    .filter(not(by('parentNode')))
    .map(function (d) { return shadow ? root.insertBefore(d, root.firstChild) : head.appendChild(d); });

  // continue with rest of the rendering pipeline
  return next(host)
}; }; };

var transform = function (styles, name) { return cssscope(styles, '[css~="' + name + '"]'); };

var log$$1 = log('[ri/precss]');
});

return precss;

}());
