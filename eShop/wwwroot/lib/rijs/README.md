# Ripple Fullstack

On the server:

**`index.js`**
```js
const ripple = require('rijs')({ dir: __dirname })
```

On the client: 

**`pages/index.html`**
```html
<script src="/ripple.js"></script>
```

Run it:

```
$ node index.js
```

This starts up a server on a random port and statically serves your `/pages` directory. You can also specify a `port` to always use, or pass an existing HTTP `server` (e.g. from express). 

Clients will then just be streamed the fine-grained resources they are using (i.e. everything is lazy loaded, no bundling, no over-fetching). 

Ripple keeps clients/servers in sync by replicating an immutable log of actions in the background, and subsequently the view - or other modules - which are reactively updated when the local store is updated.

That's it! No boilerplate necessary, no build pipeline, no special transpilation, no magical CLI.

The basic API is:

```js
ripple(name)        // getter
ripple(name, body)  // setter
ripple.on('change', (name, change) => { .. })
```

&nbsp; 
## Components

Let's add a (Web) Component to the page:

**`index.html`**
```diff
<script src="/ripple.js"></script>
+ <my-app></my-app>
```

Let's define the component:

**`resources/my-app.js:`**

```js
export default () => ()
```

Ripple is agnostic to _how_ you write your components, they should just be idempotent: a single render function. 

This is fine:

**`resources/my-app.js:`**

```js
export default (node, data) => node.innerHTML = 'Hello World!'
```

Or using some DOM-diff helper:

**`resources/my-app.js:`**

```js
export default (node, data) => jsx(node)`<h1>Hello World</h1>`
```

Or using [once](https://github.com/utilise/once#once)/D3 joins:

**`resources/my-app.js:`**

```js
export default (node, data) => {
  once(node)
    ('h1', 1)
      .text('Hello World')
})
```

For more info about writing idempotent components, see [this spec](https://github.com/pemrouz/vanilla).

&nbsp;
## State/Data

The first parameter of the component is the node to update. 

The second parameter contains all the state and data the component needs to render:

```js
export default function component(node, data){ ... }
```

* You can inject data resources by adding the name of the resources to the data attribute:

    ```html
    <my-shop data="stock">
    ```

    ```js
    export default function shop({ stock }){ ... }
    ```

    Declaring the data needed on a component is used to reactively rerender it when the data changes. 

    Alternatively, you can use `ripple.pull` directly to retrieve a resource, which has similar semantics to [dynamic `import()`](https://github.com/tc39/proposal-dynamic-import) (i.e. resolves from local cache or returns a single promise):

    ```js
    const dependency = await pull('dependency')
    ```

* The other option is to explicitly pass down data to the component from the parent:

    ```js
    once(node)
      ('my-shop', { stock })
    ```

    The helper function will set the state and redraw, so redrawing a parent will redraw it's children. If you want to do it yourself:

    ```js
    element.state = { stock }
    element.draw()
    ```

&nbsp;
## Defaults

You can set defaults using the ES6 syntax:

```js
export default function shop({ stock = [] }){ ... }
```

If you need to persist defaults on the component's state object, you can use a small [helper function](https://github.com/utilise/utilise#--defaults):

```js
export default function shop(state){ 
  const stock = defaults(state, 'stock', [])
}
```

&nbsp;
## Updates

#### Local state

Whenever you need to update local state, just change the `state` and invoke a redraw (like a game loop):

```js
export default function abacus(node, state){ 
  const o = once(node)
      , { counter = 0 } = state

  o('span', 1)
    .text(counter)

  o('button', 1)
    .text('increment')
    .on('click.increment' d => {
      state.counter++
      o.draw()
    })
}
```

#### Global state

Whenever you need to update global state, you can simply compute the new value and register it again which will trigger an update:

```js
ripple('stock', {
  apples: 10
, oranges: 20
, pomegranates: 30
})
```

Or if you just want to change a part of the resource, use a [functional operator](https://github.com/utilise/utilise#--set) to apply a finer-grained diff and trigger an update:

```js
update('pomegranates', 20)(ripple('stock'))
// same as: set({ type: 'update', key: 'pomegranate', value: 20 })(ripple('stock'))
```

Using logs of atomic diffs combines the benefits of immutability with a saner way to synchronise state across a distributed environment.

Components are rAF batched by default. You can access the list of all relevant changes since the last render in your component via `node.changes` to make it more performant if necessary.

&nbsp;
## Events

Dispatch an event on the root element to communicate changes to parents (`node.dispatchEvent`).

&nbsp;
## Routing

Routing is handled by your top-level component: Simply parse the URL to determine what children to render and invoke a redraw of your application when the route has changed: 

```js
export function app(node, data){
  const o = once(node)
      , { pathname } = location

  o('page-dashboard', pathname == '/dashboard')
  o('page-login', pathname == '/login')
 
  once(window)
    .on('popstate.nav', d => o.draw())
}
```

This solution is not tied to any library, and you may not need one at all. 

For advanced uses cases, checkout [decouter](https://github.com/pemrouz/decouter).

&nbsp;
## Styling

You can author your stylesheets assuming they are completely isolated, using the Web Component syntax (`:host` etc).

They will either be inserted in the shadow root of the element, or scoped and added to the head if there is no shadow.

By default, the CSS resource `component-name.css` will be automatically applied to the component `component-name`.

But you can apply multiple stylesheets to a component too: just extend the `css` attribute. 

&nbsp;
## Folder Convention

All files in your `/resources` folder will be automatically registered (except tests etc). You can organise it as you like, but I recommend using the convention: a folder for each component (to co-locate JS, CSS and tests), and a `data` folder for the resources that make up your domain model.

```
resources
├── data
│   ├── stock.js
│   ├── order.js
│   └── ...
├── my-app
│   ├── my-app.js
│   ├── my-app.css
│   └── test.js
├── another-component
│   ├── another-component.js
│   ├── another-component.css
│   └── test.js
└── ...
```

Hot reloading works out of the box. Any changes to these files will be instantly reflected everywhere.

&nbsp;
## Loading Resources

You can also get/set resources yourselves imperatively:

```js
ripple(name)       // getter
ripple(name, body) // setter
```

Or for example import resources from other packages:

```js
ripple
  .resource(require('external-module-1'))
  .resource(require('external-module-2'))
  .resource(require('external-module-3'))
```

You can also create resources that proxy to [fero](https://github.com/pemrouz/fero)) services too.

&nbsp;
## Offline

Resources are currently cached in `localStorage`. 

This means even _before_ any network interaction, your application renders the last-known-good-state for a superfast startup. 

Then as resources are streamed in, the relevant parts of the application are updated.

Note: Caching of resources will be improved by using ServiceWorkers under the hood instead soon ([#27](https://github.com/rijs/fullstack/issues/27))

&nbsp;
## Render Middleware

By default the draw function just invokes the function on an element. You can extend this without any framework hooks using the explicit decorator pattern:

```js
// in component
export default function component(node, data){
  middleware(node, data)
}

// around component
export default middleware(function component(node, data){
  
})

// for all components
ripple.draw = middleware(ripple.draw)
```

A few useful middleware included in this build are:

### Needs

[This middleware](https://github.com/rijs/needs#ripple--needs) reads the `needs` header and applies the attributes onto the element. The component does not render until all dependencies are available. This is useful when a component needs to define its own dependencies. You can also supply a function to dynamically calculate the required resources.

```js
export default {
  name: 'my-component'
, body: function(){}
, headers: { needs: '[css=..][data=..]' }
}
```

### Shadow

If supported by the browser, a shadow root will be created for each component. The component will render into the shadow DOM rather than the light DOM.


### Perf (Optional)

This one is not included by default, but you can use this to log out the time each component takes to render.

Other debugging tips: 

* Check `ripple.resources` for a snapshot of your application. Resources are in the [tuple format](https://github.com/rijs/core#ripple--core) `{ name, body, headers }`.

* Check `$0.state` on an element to see the state object it was last rendered with or manipulate it.

&nbsp;
## Sync

You can define a `from` function in the resource headers which will process requests from the client:

```js
const from = (req, res) => 
  req.data.type == 'REGISTER' ? register(req, res)
: req.data.type == 'FORGOT'   ? forgot(req, res)
: req.data.type == 'LOGOUT'   ? logout(req, res)
: req.data.type == 'RESET'    ? reset(req, res)
: req.data.type == 'LOGIN'    ? login(req, res)
                              : false

module.exports = { 
  name: 'users'
, body: {}
, headers: { from } 
}
```

This can return a single value, a promise or a stream. On the client you make requests with `ripple.send(name, type, value)`. This returns an awaitable [stream](https://github.com/utilise/emitterify/#emitterify).

You can also use the `.subscribe` API to subscribe to all or part of a resource. The key can be arbitrarily deep, and multiple keys will be merged into a single object. 

```js
ripple.subscribe(name, key)
ripple.subscribe(name, [keys])
```

Subscriptions are automatically deduplicated are ref-counted, so components can indepedently subscribe to the data they need without worrying about this.

Note that you can also use `ripple.get` instead of subscribe if you just want to get a single value and then automatically unsubscribe.

&nbsp;
## Ripple Minimal

If you have don't have backend for your frontend, checkout [rijs/minimal](https://github.com/rijs/minimal) which is a client-side only build of Ripple.

You can also adjust your own framework by [adding/removing modules](https://github.com/rijs/minimal/blob/master/src/index.js#L1-L11).

&nbsp;
## Docs

See [rijs/docs](https://github.com/rijs/docs) for more guides, index of modules, API reference, etc
